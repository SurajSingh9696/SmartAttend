import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await connectDB();
    
    // Find the user and verify it's an admin (college)
    const college = await User.findOne({ _id: id, role: 'admin' });
    
    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    college.isActive = isActive;
    await college.save();

    return NextResponse.json({ message: `College account ${isActive ? 'activated' : 'suspended'}` }, { status: 200 });
  } catch (error) {
    console.error('[superadmin-college-update] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
