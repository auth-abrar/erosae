import prisma from './db';
import { getAdminSession, SessionPayload } from './auth';

export const ADMIN_MODULES = [
  { key: 'CATALOG', label: 'Products & Categories', icon: 'Package' },
  { key: 'ORDERS', label: 'Orders & Shipments', icon: 'ShoppingBag' },
  { key: 'CUSTOMERS', label: 'Customers & CRM', icon: 'Users' },
  { key: 'PAYMENTS', label: 'Payment Gateways', icon: 'CreditCard' },
  { key: 'PROMOTIONS', label: 'Discounts & Coupons', icon: 'Tag' },
  { key: 'SHIPPING_TAX', label: 'Shipping & Tax Rules', icon: 'Truck' },
  { key: 'CUSTOM_FIELDS', label: 'Custom Fields Engine', icon: 'Sliders' },
  { key: 'STAFF', label: 'Staff & Roles (RBAC)', icon: 'ShieldCheck' },
  { key: 'SETTINGS', label: 'Store Settings & Theming', icon: 'Settings' },
  { key: 'REPORTS', label: 'Analytics & Reports', icon: 'BarChart3' },
] as const;

export const ADMIN_ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'] as const;

export async function hasPermission(
  adminUserId: string,
  module: string,
  action: string
): Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!admin || !admin.isActive) return false;
  if (admin.role.slug === 'super-admin') return true;

  return admin.role.permissions.some(
    (rp) => rp.permission.module === module && rp.permission.action === action
  );
}

export async function checkAdminPermission(
  module: string,
  action: string
): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Admin login required');
  }

  const allowed = await hasPermission(session.userId, module, action);
  if (!allowed) {
    throw new Error(`Forbidden: You do not have '${action}' permission for '${module}' module`);
  }

  return session;
}