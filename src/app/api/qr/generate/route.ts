import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Timetable from '@/models/Timetable';
import { generateQRToken, encodeQRPayload } from '@/lib/qr';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const timetableId = searchParams.get('timetableId');
  if (!timetableId) return NextResponse.json({ error: 'timetableId required' }, { status: 400 });

  await connectDB();
  const slot = await Timetable.findById(timetableId).populate('classId', '_id name');
  if (!slot || !slot.attendanceWindowOpen) {
    return NextResponse.json({ error: 'Attendance window is not open' }, { status: 403 });
  }

  const payload = generateQRToken(slot.classId._id.toString(), timetableId);
  const encoded = encodeQRPayload(payload);

  // Persist current token
  await Timetable.findByIdAndUpdate(timetableId, {
    currentQRToken: encoded,
    qrExpiresAt: new Date(payload.expiresAt),
  });

  return NextResponse.json({
    qrData: encoded,
    expiresAt: payload.expiresAt,
    refreshIn: 15,
  });
}
