import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Timetable from '@/models/Timetable';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');
  const query = classId ? { classId } : {};
  const slots = await Timetable.find(query).populate('classId', 'name department').lean();
  return NextResponse.json({ slots });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const slot = await Timetable.create(body);
  return NextResponse.json({ slot }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const { id, ...update } = body;
  const slot = await Timetable.findByIdAndUpdate(id, update, { new: true });
  return NextResponse.json({ slot });
}