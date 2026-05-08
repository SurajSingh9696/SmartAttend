import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Class from '@/models/Class';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const classes = await Class.find().lean();
  return NextResponse.json({ classes });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const cls = await Class.create(body);
  return NextResponse.json({ class: cls }, { status: 201 });
}