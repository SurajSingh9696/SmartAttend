import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import Timetable from '@/models/Timetable';
import User from '@/models/User';
import Class from '@/models/Class';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  // All flagged attendance records (not yet reviewed)
  const flags = await Attendance.find({ status: 'flagged' })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

  // Gather all student and class IDs
  const studentIds = [...new Set(flags.map(f => f.studentId.toString()))];
  const classIds = [...new Set(flags.map(f => f.classId.toString()))];
  const timetableIds = [...new Set(flags.map(f => f.timetableId.toString()))];

  const [students, classes, timetables] = await Promise.all([
    Student.find({ _id: { $in: studentIds } }).populate('userId', 'name').lean(),
    Class.find({ _id: { $in: classIds } }).lean(),
    Timetable.find({ _id: { $in: timetableIds } }).lean(),
  ]);

  const studentMap: Record<string, any> = {};
  students.forEach((s: any) => { studentMap[s._id.toString()] = s; });
  const classMap: Record<string, any> = {};
  classes.forEach((c: any) => { classMap[c._id.toString()] = c; });
  const timetableMap: Record<string, any> = {};
  timetables.forEach((t: any) => { timetableMap[t._id.toString()] = t; });

  const enriched = flags.map(f => {
    const stu = studentMap[f.studentId.toString()];
    const cls = classMap[f.classId.toString()];
    const slot = timetableMap[f.timetableId.toString()];
    return {
      id: f._id.toString(),
      student: stu?.userId?.name || 'Unknown',
      rollNo: stu?.rollNo || '-',
      class: cls ? `${slot?.subject || 'Class'} - ${cls.name}` : 'Unknown',
      date: f.date ? new Date(f.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
      time: f.timestamp ? new Date(f.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
      reason: f.flagReason || 'Suspicious activity',
      risk: f.riskScore,
      deviceId: f.deviceId || '-',
      ipAddress: f.ipAddress || '-',
      status: f.status,
    };
  });

  return NextResponse.json({ flags: enriched });
}

// PATCH — approve or reject a flagged record
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, action } = await req.json(); // action: 'approve' | 'reject'
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await connectDB();

  const newStatus = action === 'approve' ? 'present' : 'rejected';
  await Attendance.findByIdAndUpdate(id, {
    status: newStatus,
    reviewedBy: session.user.id,
    reviewedAt: new Date(),
  });

  return NextResponse.json({ success: true, newStatus });
}
