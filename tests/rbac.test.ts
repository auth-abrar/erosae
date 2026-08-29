import { describe, it, expect } from 'vitest';
import { hasPermission, AdminSessionPayload } from '../src/lib/auth';

describe('Server-Side RBAC & Permission Enforcement', () => {
  const staffSession: AdminSessionPayload = {
    adminId: 'adm_staff_1',
    email: 'staff@erosae.com',
    name: 'Support Staff',
    role: 'Support Representative',
    permissions: ['crm.manage', 'orders.view'],
  };

  const superAdminSession: AdminSessionPayload = {
    adminId: 'adm_super_1',
    email: 'admin@erosae.com',
    name: 'Master Admin',
    role: 'Super Admin',
    permissions: [],
  };

  it('should grant access to staff with matching permissions', () => {
    expect(hasPermission(staffSession, 'orders.view')).toBe(true);
    expect(hasPermission(staffSession, 'crm.manage')).toBe(true);
  });

  it('should deny access to staff lacking required permissions', () => {
    expect(hasPermission(staffSession, 'catalog.create')).toBe(false);
    expect(hasPermission(staffSession, 'finance.view')).toBe(false);
    expect(hasPermission(staffSession, 'settings.manage')).toBe(false);
  });

  it('should grant unlimited access to Super Admin role regardless of permissions array', () => {
    expect(hasPermission(superAdminSession, 'catalog.create')).toBe(true);
    expect(hasPermission(superAdminSession, 'finance.view')).toBe(true);
    expect(hasPermission(superAdminSession, 'any.custom.permission')).toBe(true);
  });

  it('should deny access if session is null', () => {
    expect(hasPermission(null, 'orders.view')).toBe(false);
  });
});
