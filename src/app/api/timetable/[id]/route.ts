import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Timetable from '@/models/Timetable';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const slot = await Timetable.findById(id)
    .populate('classId', 'name department totalStudents')
    .lean() as any;

  if (!slot) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    slot: {
      id: slot._id.toString(),
      subject: slot.subject,
      room: slot.room,
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayOfWeek: slot.dayOfWeek,
      className: slot.classId?.name || 'Unknown',
      totalStudents: slot.classId?.totalStudents ?? 0,
      attendanceWindowOpen: slot.attendanceWindowOpen,
    },
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  await Timetable.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
