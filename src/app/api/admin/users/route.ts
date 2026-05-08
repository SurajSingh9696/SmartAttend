import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();
  const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();
  const { name, email, password, role, rollNo, department, semester, classId, employeeId } = body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

  const hashed = await bcrypt.hash(password || 'demo123', 10);
  const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role });

  if (role === 'student') {
    await Student.create({ userId: user._id, rollNo, classId, department, semester: Number(semester) });
  } else if (role === 'teacher') {
    await Teacher.create({ userId: user._id, employeeId, department, subjects: [], classIds: [] });
  }

  return NextResponse.json({ success: true, userId: user._id }, { status: 201 });
}