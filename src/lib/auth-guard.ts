import { NextResponse } from 'next/server';
import { getAdminSession, getUserSession, hasPermission, AdminSessionPayload, UserSessionPayload } from './auth';

export class AuthGuard {
  /**
   * Enforces that the request has an active Admin session, optionally checking for a required permission code.
   * Returns the AdminSessionPayload if valid, or a NextResponse 401/403 error.
   */
  static async requireAdmin(
    requiredPermission?: string
  ): Promise<{ session: AdminSessionPayload } | { errorResponse: NextResponse }> {
    const session = await getAdminSession();

    if (!session) {
      return {
        errorResponse: NextResponse.json(
          { success: false, message: 'Unauthorized. Admin session required.' },
          { status: 401 }
        ),
      };
    }

    if (requiredPermission && !hasPermission(session, requiredPermission)) {
      return {
        errorResponse: NextResponse.json(
          {
            success: false,
            message: `Forbidden. Missing required permission: '${requiredPermission}'.`,
          },
          { status: 403 }
        ),
      };
    }

    return { session };
  }

  /**
   * Enforces that the request has an active authenticated Customer User session.
   */
  static async requireUser(): Promise<{ session: UserSessionPayload } | { errorResponse: NextResponse }> {
    const session = await getUserSession();

    if (!session) {
      return {
        errorResponse: NextResponse.json(
          { success: false, message: 'Unauthorized. Customer login required.' },
          { status: 401 }
        ),
      };
    }

    return { session };
  }
}
