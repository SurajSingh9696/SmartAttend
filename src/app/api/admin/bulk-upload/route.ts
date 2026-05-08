import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectDB();

  const body = await req.json();
  const { rows } = body as { rows: Array<{ name: string; email: string; role: string; department?: string; rollNo?: string; classId?: string; employeeId?: string; semester?: string }> };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
  }

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      const existing = await User.findOne({ email: row.email });
      if (existing) { results.skipped++; continue; }
      const hash = await bcrypt.hash('demo123', 10);
      const user = await User.create({ name: row.name, email: row.email, password: hash, role: row.role });
      if (row.role === 'student') {
        await Student.create({ userId: user._id, rollNo: row.rollNo, department: row.department, classId: row.classId, semester: Number(row.semester) || 1, trustScore: 100 });
      } else if (row.role === 'teacher') {
        await Teacher.create({ userId: user._id, employeeId: row.employeeId, department: row.department });
      }
      results.created++;
    } catch (e) {
      results.errors.push(`${row.email}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ success: true, ...results });
}