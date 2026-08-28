import React from 'react';
import prisma from '@/lib/db';
import { ShieldCheck, UserPlus, Users, KeyRound } from 'lucide-react';
import StaffClient from './StaffClient';

export default async function AdminStaffPage() {
  const [adminUsers, roles, allPermissions] = await Promise.all([
    prisma.adminUser.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    }),
    prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    }),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Accounts & Role Permissions (RBAC)</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Define custom roles and control granular access to catalog, orders, payment configurations, and customer CRM.
          </p>
        </div>
      </div>

      <StaffClient
        initialStaff={adminUsers}
        initialRoles={roles}
        allPermissions={allPermissions}
      />
    </div>
  );
}