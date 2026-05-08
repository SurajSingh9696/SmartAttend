import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'flagged';
  const limit = parseInt(searchParams.get('limit') || '50');
  const entries = await Attendance.find({ status })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('studentId', 'rollNumber')
    .lean();
  return NextResponse.json({ entries });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const { attendanceId, action } = body;
  if (!attendanceId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'attendanceId and action (approve|reject) required' }, { status: 400 });
  }
  const newStatus = action === 'approve' ? 'present' : 'rejected';
  const entry = await Attendance.findByIdAndUpdate(attendanceId, { status: newStatus, reviewedAt: new Date(), reviewedBy: session.user.id }, { new: true });
  return NextResponse.json({ entry });
}