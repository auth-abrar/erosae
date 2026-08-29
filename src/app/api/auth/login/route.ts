import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, createUserSession, USER_SESSION_COOKIE, COOKIE_OPTIONS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both email and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const token = await createUserSession(user);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(USER_SESSION_COOKIE, token, COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    console.error('Customer login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed due to a server error.' },
      { status: 500 }
    );
  }
}
