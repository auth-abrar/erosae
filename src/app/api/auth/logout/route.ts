import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { USER_SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(USER_SESSION_COOKIE)?.value;

    if (token) {
      // Invalidate session in database
      await prisma.userSession.updateMany({
        where: { sessionToken: token },
        data: { isRevoked: true },
      }).catch(() => {});
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    response.cookies.delete(USER_SESSION_COOKIE);
    return response;
  } catch (error) {
    const response = NextResponse.json({ success: true });
    response.cookies.delete(USER_SESSION_COOKIE);
    return response;
  }
}
