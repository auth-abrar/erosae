import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, createUserSession, USER_SESSION_COOKIE, COOKIE_OPTIONS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid full name.' },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, ...(phone ? [{ phone: phone.trim() }] : [])],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email or phone already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            segment: 'NEW_CUSTOMER',
          },
        },
        loyaltyAccount: {
          create: {
            pointsTotal: 50, // Welcome points bonus
          },
        },
      },
    });

    const token = await createUserSession(user);

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully.',
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
    console.error('Customer registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Registration failed due to a server error.' },
      { status: 500 }
    );
  }
}
