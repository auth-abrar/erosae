import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'development' ? 'erosae-dev-secret-key-32chars-minimum' : '');

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing.');
}

export const ADMIN_SESSION_COOKIE = 'erosae_admin_session';
export const USER_SESSION_COOKIE = 'erosae_user_session';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: object, expiresIn: string | number = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (error) {
    return null;
  }
}

export interface AdminSessionPayload {
  adminId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Server-side helper to create authenticated user session in database and return signed token
 */
export async function createUserSession(user: { id: string; email: string; name: string; role: string }, ipAddress?: string, userAgent?: string): Promise<string> {
  const payload: UserSessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = signToken(payload, '7d');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: token,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
      },
    });
  } catch (e) {
    console.error('Session record error:', e);
  }

  return token;
}

/**
 * Server-side helper to create authenticated admin session
 */
export async function createAdminSession(admin: { id: string; email: string; name: string; roleName: string; permissions: string[] }, ipAddress?: string, userAgent?: string): Promise<string> {
  const payload: AdminSessionPayload = {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.roleName,
    permissions: admin.permissions,
  };

  const token = signToken(payload, '7d');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    await prisma.userSession.create({
      data: {
        adminUserId: admin.id,
        sessionToken: token,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
      },
    });
  } catch (e) {
    console.error('Admin session record error:', e);
  }

  return token;
}

/**
 * Server-side helper to get current logged in Admin with verified permissions
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return null;

    const payload = verifyToken<AdminSessionPayload>(token);
    if (!payload || !payload.adminId) return null;

    // Verify still active in database
    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.adminId },
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

    if (!admin || !admin.isActive) return null;

    const permissions = admin.role.permissions.map((rp) => rp.permission.code);
    return {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role.name,
      permissions,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Server-side helper to check if admin has required permission
 */
export function hasPermission(adminSession: AdminSessionPayload | null, permissionCode: string): boolean {
  if (!adminSession) return false;
  if (adminSession.role === 'Super Admin') return true;
  return adminSession.permissions.includes(permissionCode);
}

/**
 * Server-side helper to get current logged in Customer User
 */
export async function getUserSession(): Promise<UserSessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
    if (!token) return null;

    const payload = verifyToken<UserSessionPayload>(token);
    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status !== 'ACTIVE') return null;

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    return null;
  }
}
