import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';
import { Money } from '@/lib/money';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await AuthGuard.requireAdmin('finance.view');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const accounts = await prisma.account.findMany({
      orderBy: { code: 'asc' },
    });

    const journals = await prisma.journalEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        lines: {
          include: {
            account: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, accounts, journals });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await AuthGuard.requireAdmin('finance.view');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const { description, referenceType = 'MANUAL_JOURNAL', referenceId, lines } = body;

    if (!description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        { success: false, message: 'A journal entry requires a description and at least 2 balanced lines.' },
        { status: 400 }
      );
    }

    // Verify double-entry balance: Total Debits == Total Credits
    const formattedLines = lines.map((l: any) => ({
      accountId: l.accountId,
      debitBDT: Money.round(parseFloat(l.debitBDT) || 0),
      creditBDT: Money.round(parseFloat(l.creditBDT) || 0),
      memo: l.memo || null,
    }));

    if (!Money.isJournalBalanced(formattedLines)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unbalanced Journal Entry! Total Debits must equal Total Credits exactly.',
        },
        { status: 400 }
      );
    }

    const entryNumber = `JE-MAN-${Date.now()}`;

    const journal = await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          description,
          referenceType,
          referenceId,
          lines: {
            create: formattedLines,
          },
        },
        include: {
          lines: {
            include: { account: true },
          },
        },
      });

      // Update account balances
      for (const line of formattedLines) {
        const netDelta = line.debitBDT - line.creditBDT;
        await tx.account.update({
          where: { id: line.accountId },
          data: {
            balanceBDT: {
              increment: netDelta,
            },
          },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          adminUserId: guard.session.adminId,
          action: 'MANUAL_JOURNAL_CREATE',
          resource: 'JournalEntry',
          resourceId: entry.id,
          beforeState: null,
          afterState: JSON.stringify({ entryNumber, linesCount: formattedLines.length }),
        },
      });

      return entry;
    });

    return NextResponse.json({
      success: true,
      message: `Journal entry '${entryNumber}' created successfully.`,
      journal,
    });
  } catch (error: any) {
    console.error('Accounting POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
