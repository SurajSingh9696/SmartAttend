import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Student from '@/models/Student';
import Timetable from '@/models/Timetable';
import Attendance from '@/models/Attendance';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  // Find the student record
  const student = await Student.findOne({ userId: session.user.id }).lean();
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  // Today's timetable slots for this student's class
  const today = new Date().getDay();
  const todaySlots = await Timetable.find({
    classId: student.classId,
    dayOfWeek: today,
    isActive: true,
  })
    .populate('teacherId', 'userId')
    .lean();

  // For each slot, check if student already marked attendance today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const markedIds = await Attendance.find({
    studentId: student._id,
    date: { $gte: todayStart },
    status: { $in: ['present', 'flagged'] },
  }).distinct('timetableId');

  const markedSet = new Set(markedIds.map((id: mongoose.Types.ObjectId) => id.toString()));

  // Determine status for each slot
  const now = new Date();
  const classes = todaySlots.map(slot => {
    const isOpen = !!(
      slot.attendanceWindowOpen &&
      slot.attendanceWindowOpenAt &&
      slot.attendanceWindowCloseAt &&
      now >= new Date(slot.attendanceWindowOpenAt) &&
      now <= new Date(slot.attendanceWindowCloseAt)
    );
    const alreadyMarked = markedSet.has(slot._id.toString());
    let status: 'active' | 'upcoming' | 'completed' = 'upcoming';
    if (alreadyMarked) status = 'completed';
    else if (isOpen) status = 'active';

    return {
      id: slot._id.toString(),
      subject: slot.subject,
      room: slot.room,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status,
      windowOpen: isOpen,
      alreadyMarked,
    };
  });

  // Overall attendance stats
  const allAttendance = await Attendance.find({ studentId: student._id }).lean();
  const total = allAttendance.length;
  const present = allAttendance.filter(a => a.status === 'present').length;
  const absent = allAttendance.filter(a => a.status === 'absent').length;
  const flagged = allAttendance.filter(a => a.status === 'flagged').length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return NextResponse.json({
    classes,
    stats: { total, present, absent, flagged, percentage: pct },
    trustScore: student.trustScore,
    studentId: student._id.toString(),
  });
}
