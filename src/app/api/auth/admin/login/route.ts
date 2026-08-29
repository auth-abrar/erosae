import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, createAdminSession, ADMIN_SESSION_COOKIE, COOKIE_OPTIONS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both admin email and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const admin = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { success: false, message: 'Invalid administrative credentials.' },
        { status: 401 }
      );
    }

    // Check account lockout
    if (admin.lockoutUntil && admin.lockoutUntil > new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account temporarily locked due to excessive failed attempts. Try again later.',
        },
        { status: 423 }
      );
    }

    const isValid = await verifyPassword(password, admin.passwordHash);

    if (!isValid) {
      // Increment failed attempts and lock if >= 5
      const attempts = admin.failedLoginAttempts + 1;
      const lockoutUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: attempts,
          lockoutUntil,
        },
      });

      return NextResponse.json(
        { success: false, message: 'Invalid administrative credentials.' },
        { status: 401 }
      );
    }

    // Reset failed attempts & record login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const permissions = admin.role.permissions.map((rp) => rp.permission.code);
    const token = await createAdminSession({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      roleName: admin.role.name,
      permissions,
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'ADMIN_LOGIN',
        resource: 'AdminUser',
        resourceId: admin.id,
        beforeState: null,
        afterState: JSON.stringify({ email: admin.email, role: admin.role.name }),
      },
    }).catch(() => {});

    const response = NextResponse.json({
      success: true,
      message: 'Admin authorization successful.',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role.name,
        permissions,
      },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication error.' },
      { status: 500 }
    );
  }
}
