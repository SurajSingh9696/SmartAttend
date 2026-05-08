import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import Timetable from '@/models/Timetable';
import { decodeAndValidateQR } from '@/lib/qr';
import { runFraudCheck } from '@/lib/fraud';
import { IVerificationStep } from '@/models/Attendance';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { timetableId, qrEncoded, deviceId, fingerprint, gpsLat, gpsLng, faceVerified, livenessVerified } = body;

  await connectDB();

  const student = await Student.findOne({ userId: session.user.id });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const slot = await Timetable.findById(timetableId);
  if (!slot) return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });

  const steps: IVerificationStep[] = [];
  let rejected = false;
  let riskScore = 0;

  // ── 1. Device Check ──────────────────────
  const deviceMatch = !student.deviceId || student.deviceId === deviceId;
  steps.push({ step: 'Device Check', status: deviceMatch ? 'pass' : 'fail', detail: deviceMatch ? 'Device matches registered device' : 'Unknown device detected' });
  if (!deviceMatch) { rejected = true; riskScore += 40; }

  // ── 2. Time Check ────────────────────────
  const now = new Date();
  const windowOpen = slot.attendanceWindowOpen &&
    slot.attendanceWindowOpenAt && slot.attendanceWindowCloseAt &&
    now >= slot.attendanceWindowOpenAt && now <= slot.attendanceWindowCloseAt;
  steps.push({ step: 'Time Check', status: windowOpen ? 'pass' : 'fail', detail: windowOpen ? 'Within attendance window' : 'Outside attendance window' });
  if (!windowOpen) { rejected = true; }

  // ── 3. Location Check ────────────────────
  const hasLocation = gpsLat !== undefined && gpsLng !== undefined;
  steps.push({ step: 'Location Check', status: hasLocation ? 'pass' : 'fail', detail: hasLocation ? `GPS: ${gpsLat?.toFixed(4)}, ${gpsLng?.toFixed(4)}` : 'Location unavailable' });

  // ── 4. Network Check ─────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const isKnownIP = ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.');
  steps.push({ step: 'Network Check', status: isKnownIP ? 'pass' : 'fail', detail: isKnownIP ? 'Campus network detected' : `Non-campus IP: ${ip}` });
  if (!isKnownIP) riskScore += 10;

  // ── 5. QR Validation ─────────────────────
  const qrResult = decodeAndValidateQR(qrEncoded, slot.classId.toString(), timetableId);
  steps.push({ step: 'QR Validation', status: qrResult.valid ? 'pass' : 'fail', detail: qrResult.valid ? 'QR token valid' : qrResult.reason });
  if (!qrResult.valid) { rejected = true; riskScore += 30; }

  // ── 6. Face + Liveness ───────────────────
  const faceOk = faceVerified && livenessVerified;
  steps.push({ step: 'Face + Liveness', status: faceOk ? 'pass' : 'fail', detail: faceOk ? 'Face match and liveness confirmed' : 'Face/liveness check failed' });
  if (!faceOk) { rejected = true; riskScore += 20; }

  // ── 7. Fraud Check ───────────────────────
  const now10MinAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentByDevice = deviceId ? await Attendance.countDocuments({ deviceId, timestamp: { $gte: now10MinAgo } }) : 0;

  const fraudResult = runFraudCheck({
    studentId: student._id.toString(),
    deviceId, browserFingerprint: fingerprint,
    ipAddress: ip, gpsLat, gpsLng,
    submittedAt: now,
    recentAttendanceByDevice: recentByDevice,
    timeSinceWindowOpen: slot.attendanceWindowOpenAt
      ? Math.floor((now.getTime() - slot.attendanceWindowOpenAt.getTime()) / 1000)
      : 999,
  });
  steps.push(fraudResult.verificationStep);
  riskScore = Math.min(100, riskScore + fraudResult.riskScore);

  // ── Final Status ──────────────────────────
  let finalStatus: 'present' | 'flagged' | 'rejected' = 'present';
  if (rejected) finalStatus = 'rejected';
  else if (fraudResult.status === 'fraud') finalStatus = 'flagged';
  else if (fraudResult.status === 'suspicious') finalStatus = 'flagged';

  // Save device binding if first time
  if (!student.deviceId && deviceId) {
    await Student.findByIdAndUpdate(student._id, { deviceId, browserFingerprint: fingerprint });
  }

  // Deduct trust score
  if (fraudResult.trustScoreDeduction > 0) {
    await Student.findByIdAndUpdate(student._id, {
      $inc: { trustScore: -fraudResult.trustScoreDeduction, flaggedCount: finalStatus === 'flagged' ? 1 : 0 },
    });
  }

  const attendance = await Attendance.create({
    studentId: student._id,
    classId: slot.classId,
    timetableId,
    date: new Date(now.toDateString()),
    timestamp: now,
    status: finalStatus,
    riskScore,
    trustScoreAtTime: student.trustScore,
    verificationSteps: steps,
    deviceId, browserFingerprint: fingerprint,
    ipAddress: ip, gpsLat, gpsLng,
    flagReason: fraudResult.flags.join('; ') || undefined,
  });

  return NextResponse.json({
    success: true,
    status: finalStatus,
    riskScore,
    steps,
    attendanceId: attendance._id,
    flags: fraudResult.flags,
  });
}
