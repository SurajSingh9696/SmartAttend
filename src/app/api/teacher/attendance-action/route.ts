import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const { recordId, action } = await req.json();

  if (!recordId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const update = action === 'approve' 
    ? { status: 'present', riskScore: 0, flagReason: null, flags: [] } 
    : { status: 'rejected' };

  const record = await Attendance.findByIdAndUpdate(recordId, update, { new: true });

  if (!record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, record });
}
