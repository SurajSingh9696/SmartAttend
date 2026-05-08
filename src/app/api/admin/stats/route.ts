import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Class from '@/models/Class';
import Student from '@/models/Student';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const [totalStudents, totalTeachers, totalClasses, totalFlags] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    Class.countDocuments({}),
    Attendance.countDocuments({ status: 'flagged', date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
  ]);

  // Recent fraud flags (today)
  const recentFlags = await Attendance.find({
    status: 'flagged',
    date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  })
    .sort({ timestamp: -1 })
    .limit(5)
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .populate('classId', 'name')
    .lean();

  const fraudList = recentFlags.map((f: any) => ({
    student: f.studentId?.userId?.name || 'Unknown',
    class: f.classId?.name || 'Unknown',
    reason: f.flagReason || 'Suspicious activity',
    risk: f.riskScore,
    time: f.timestamp ? new Date(f.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
  }));

  return NextResponse.json({
    stats: { totalStudents, totalTeachers, totalClasses, totalFlags },
    recentFraud: fraudList,
  });
}
