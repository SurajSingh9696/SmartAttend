import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import Timetable from '@/models/Timetable';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const student = await Student.findOne({ userId: session.user.id }).lean();
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const records = await Attendance.find({ studentId: student._id })
    .sort({ date: -1, timestamp: -1 })
    .lean();

  // Enrich with timetable (subject) info
  const timetableIds = [...new Set(records.map(r => r.timetableId.toString()))];
  const slots = await Timetable.find({ _id: { $in: timetableIds } }).select('subject').lean();
  const slotMap: Record<string, string> = {};
  slots.forEach(s => { slotMap[s._id.toString()] = s.subject; });

  const history = records.map(r => ({
    id: r._id.toString(),
    date: new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    subject: slotMap[r.timetableId.toString()] || 'Unknown',
    time: r.timestamp ? new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
    status: r.status,
    riskScore: r.riskScore ?? 0,
    flagReason: r.flagReason,
  }));

  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const flagged = records.filter(r => r.status === 'flagged').length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return NextResponse.json({
    history,
    stats: { total, present, absent, flagged, percentage: pct },
    trustScore: student.trustScore,
  });
}
