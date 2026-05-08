import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  const user = await User.findById(id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await User.findByIdAndDelete(id);

  if (user.role === 'student') {
    await Student.findOneAndDelete({ userId: id });
  } else if (user.role === 'teacher') {
    await Teacher.findOneAndDelete({ userId: id });
  }

  return NextResponse.json({ success: true });
}
