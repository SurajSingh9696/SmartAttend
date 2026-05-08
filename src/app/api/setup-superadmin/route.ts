import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();

    // Check if a superadmin already exists
    const existingSuperadmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperadmin) {
      return NextResponse.json(
        { error: 'Superadmin already exists. Setup is locked.' },
        { status: 403 }
      );
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash('superadmin123', 10);

    // Create the superadmin
    const superadmin = await User.create({
      name: 'Global Superadmin',
      email: 'superadmin@smartattend.com',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
    });

    return NextResponse.json(
      {
        message: 'Superadmin created successfully',
        email: 'superadmin@smartattend.com',
        password: 'superadmin123',
        warning: 'Please log in immediately and change this password.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[setup-superadmin] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
