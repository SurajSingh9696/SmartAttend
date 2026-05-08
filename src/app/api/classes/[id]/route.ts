import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Class from '@/models/Class';
import Timetable from '@/models/Timetable';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  await Class.findByIdAndDelete(id);
  await Timetable.deleteMany({ classId: id }); // Clean up associated timetable slots

  return NextResponse.json({ success: true });
}
