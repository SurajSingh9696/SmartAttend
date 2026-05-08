import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Teacher from '@/models/Teacher';
import Timetable from '@/models/Timetable';
import Attendance from '@/models/Attendance';
import Class from '@/models/Class';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const teacher = await Teacher.findOne({ $or: [{ userId: session.user.id }, { classIds: { $exists: true } }], userId: session.user.id }).lean();
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

  const today = new Date().getDay();
  const todaySlots = await Timetable.find({
    teacherId: teacher._id,
    dayOfWeek: today,
    isActive: true,
  }).lean();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // For each slot, count attendance
  const classes = await Promise.all(
    todaySlots.map(async slot => {
      const [presentCount, flaggedCount, cls] = await Promise.all([
        Attendance.countDocuments({ timetableId: slot._id, date: { $gte: todayStart }, status: 'present' }),
        Attendance.countDocuments({ timetableId: slot._id, date: { $gte: todayStart }, status: 'flagged' }),
        Class.findById(slot.classId).lean(),
      ]);

      const total = (cls as any)?.totalStudents ?? 0;
      const now = new Date();
      const isOpen = !!(
        slot.attendanceWindowOpen &&
        slot.attendanceWindowOpenAt &&
        slot.attendanceWindowCloseAt &&
        now >= new Date(slot.attendanceWindowOpenAt) &&
        now <= new Date(slot.attendanceWindowCloseAt)
      );

      return {
        id: slot._id.toString(),
        subject: slot.subject,
        class: (cls as any)?.name || 'Unknown',
        room: slot.room,
        startTime: slot.startTime,
        endTime: slot.endTime,
        present: presentCount,
        flagged: flaggedCount,
        total,
        status: isOpen ? 'active' : 'upcoming',
      };
    })
  );

  // Summary stats
  const totalStudents = classes.reduce((a, c) => a + c.present, 0);
  const totalFlagged = classes.reduce((a, c) => a + c.flagged, 0);
  const totalPossible = classes.reduce((a, c) => a + c.total, 0);
  const avgPct = totalPossible > 0 ? Math.round((totalStudents / totalPossible) * 100) : 0;

  return NextResponse.json({
    classes,
    stats: {
      assignedClasses: classes.length,
      studentsToday: totalStudents,
      flaggedAttempts: totalFlagged,
      avgAttendance: avgPct + '%',
    },
  });
}
