import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Timetable from '@/models/Timetable';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const timetableId = searchParams.get('timetableId');
  if (!timetableId) return NextResponse.json({ error: 'timetableId required' }, { status: 400 });
  await connectDB();
  const slot = await Timetable.findById(timetableId).lean();
  if (!slot) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const now = new Date();
  const open = !!(slot.attendanceWindowOpen && slot.attendanceWindowOpenAt && slot.attendanceWindowCloseAt &&
    now >= slot.attendanceWindowOpenAt && now <= slot.attendanceWindowCloseAt);
  return NextResponse.json({ open, slot });
}