import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// Demo accounts for when MongoDB is not available
const DEMO_USERS = [
  { id: 'demo-admin',   name: 'Admin User',   email: 'admin@demo.edu',   password: 'demo123', role: 'admin' },
  { id: 'demo-teacher', name: 'Dr. Sharma',   email: 'teacher@demo.edu', password: 'demo123', role: 'teacher' },
  { id: 'demo-student', name: 'Aarav Sharma', email: 'student@demo.edu', password: 'demo123', role: 'student' },
];

const secret = process.env.NEXTAUTH_SECRET;
if (!secret || secret.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[auth] NEXTAUTH_SECRET must be set to a secure 256-bit value in production!');
  } else {
    console.warn('[auth] WARNING: NEXTAUTH_SECRET is missing or too short. Set a strong secret in .env.local');
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Demo mode — use in-memory accounts (bcrypt not used here intentionally for demo only)
        if (process.env.DEMO_MODE === 'true') {
          const demo = DEMO_USERS.find(
            u => u.email === credentials.email && u.password === credentials.password
          );
          if (demo) return { id: demo.id, name: demo.name, email: demo.email, role: demo.role };
          return null;
        }

        // Production — use MongoDB with bcrypt password verification
        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email, isActive: true });
          if (!user) return null;
          const valid = await bcrypt.compare(credentials.password as string, user.password);
          if (!valid) return null;
          return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  // Explicit cookie hardening — HttpOnly, SameSite=Lax, Secure in production
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token.v2'
        : 'authjs.session-token.v2',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});
