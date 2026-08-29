import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const policies = await prisma.policy.findMany({
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
      orderBy: { slug: 'asc' },
    });

    const consentLogs = await prisma.consentLog.findMany({
      orderBy: { consentedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      policies,
      consentLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await AuthGuard.requireAdmin('settings.manage');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const { slug, type, titleEn, titleBn, contentEn, contentBn, status = 'PUBLISHED' } = body;

    if (!slug || !titleEn || !contentEn) {
      return NextResponse.json(
        { success: false, message: 'Policy slug, English title, and English content are required.' },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim();
    const policyType = (type || cleanSlug.replace(/-/g, '_')).toUpperCase();

    const policy = await prisma.$transaction(async (tx) => {
      // Find or create parent policy
      let existingPolicy = await tx.policy.findFirst({
        where: { OR: [{ slug: cleanSlug }, { type: policyType }] },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      });

      if (!existingPolicy) {
        existingPolicy = await tx.policy.create({
          data: {
            slug: cleanSlug,
            type: policyType,
            titleEn,
            titleBn: titleBn || titleEn,
          },
          include: { versions: true },
        });
      }

      const nextVersionNumber = (existingPolicy.versions?.[0]?.versionNumber || 0) + 1;

      // Create new version
      const newVersion = await tx.policyVersion.create({
        data: {
          policyId: existingPolicy.id,
          versionNumber: nextVersionNumber,
          contentEn,
          contentBn: contentBn || contentEn,
          status,
          effectiveDate: new Date(),
          approvedBy: guard.session.name || 'Master Admin',
        },
      });

      // Update parent policy title
      await tx.policy.update({
        where: { id: existingPolicy.id },
        data: {
          titleEn,
          titleBn: titleBn || titleEn,
        },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          adminUserId: guard.session.adminId,
          action: 'POLICY_VERSION_PUBLISH',
          resource: 'PolicyVersion',
          resourceId: newVersion.id,
          beforeState: null,
          afterState: JSON.stringify({ slug: cleanSlug, versionNumber: nextVersionNumber, status }),
        },
      });

      return existingPolicy;
    });

    return NextResponse.json({
      success: true,
      message: `Policy '${cleanSlug}' updated to new version.`,
      policy,
    });
  } catch (error: any) {
    console.error('Policy POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
