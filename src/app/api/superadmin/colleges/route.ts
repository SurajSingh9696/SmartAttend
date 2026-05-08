import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const colleges = await User.find({ role: 'admin' })
      .select('name email isActive createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({ colleges }, { status: 200 });
  } catch (error) {
    console.error('[superadmin-colleges] Error fetching colleges:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
