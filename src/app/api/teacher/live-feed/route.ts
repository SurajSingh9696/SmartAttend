import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import User from '@/models/User';

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);
  const timetableId = searchParams.get('timetableId');

  if (!timetableId) {
    return NextResponse.json({ error: 'Missing timetableId' }, { status: 400 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Fetch all attendance records for this slot today
  const records = await Attendance.find({
    timetableId,
    date: { $gte: todayStart }
  }).sort({ timestamp: -1 }).lean();

  // Populate student details manually because we need User + Student info
  const feed = await Promise.all(records.map(async (record: any) => {
    const student = await Student.findById(record.studentId).populate('userId', 'name').lean() as any;
    
    // Format timestamp
    const date = new Date(record.timestamp);
    const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return {
      id: record._id.toString(),
      name: student?.userId?.name || 'Unknown',
      rollNo: student?.rollNo || 'Unknown',
      time: timeString,
      status: record.status,
      riskScore: record.riskScore || 0,
      reason: record.flagReason || (record.flags && record.flags.join(', ')),
    };
  }));

  return NextResponse.json({ feed });
}
