'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserPlus, Users, KeyRound, Check, X } from 'lucide-react';

export default function StaffClient({
  initialStaff,
  initialRoles,
  allPermissions,
}: {
  initialStaff: any[];
  initialRoles: any[];
  allPermissions: any[];
}) {
  const [staff, setStaff] = useState(initialStaff);
  const [roles, setRoles] = useState(initialRoles);
  const [activeTab, setActiveTab] = useState<'STAFF' | 'ROLES'>('STAFF');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const modules = Array.from(new Set(allPermissions.map((p) => p.module)));

  const handleTogglePerm = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          description: roleDesc,
          permissionIds: selectedPermIds,
        }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 w-fit text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('STAFF')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'STAFF'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Staff Accounts ({staff.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ROLES')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'ROLES'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Custom Roles & Permissions Matrix ({roles.length})
        </button>
      </div>

      {activeTab === 'STAFF' ? (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Role</th>
                <th className="p-4">2FA Security</th>
                <th className="p-4">Last Login</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {staff.map((st) => (
                <tr key={st.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4">
                    <div className="font-bold text-white">{st.name}</div>
                    <div className="text-slate-400 font-mono text-[10px]">{st.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
                      {st.role?.name || 'Staff'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {st.twoFactorEnabled ? (
                      <span className="text-emerald-400 font-semibold">✓ Enabled</span>
                    ) : (
                      <span className="text-slate-500">Disabled</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400">
                    {st.lastLoginAt ? new Date(st.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(true)}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Define Custom Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((r) => (
              <div key={r.id} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{r.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{r.description || 'No description'}</p>
                  </div>
                  {r.isSystem && (
                    <span className="bg-brand-950 border border-brand-800 text-brand-300 text-[10px] font-bold px-2 py-0.5 rounded">
                      System Role
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Granted Permissions ({r.permissions?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {r.permissions?.map((rp: any) => (
                      <span
                        key={rp.permissionId}
                        className="bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono"
                      >
                        {rp.permission?.module}:{rp.permission?.action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Define Custom Role */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">Define Custom Staff Role</h3>
                <p className="text-xs text-slate-400">Select exact permissions matrix for this role.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Catalog Specialist"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Can edit and bulk import catalog products"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-2">Permission Checkbox Matrix</label>
                <div className="max-h-64 overflow-y-auto space-y-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  {modules.map((mod) => {
                    const modPerms = allPermissions.filter((p) => p.module === mod);
                    return (
                      <div key={mod} className="space-y-1.5 pb-2 border-b border-slate-900">
                        <div className="font-bold text-brand-400 uppercase text-[10px] tracking-wider">
                          {mod}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {modPerms.map((p) => {
                            const isChecked = selectedPermIds.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer transition ${
                                  isChecked
                                    ? 'bg-brand-950 border-brand-700 text-brand-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePerm(p.id)}
                                  className="hidden"
                                />
                                <span>{p.action}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  Save Custom Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}