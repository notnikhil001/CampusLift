import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { User } from '../../types';
import { Search, ShieldCheck, UserX, UserCheck, Trash2, AlertTriangle } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    const res = await apiFetch<User[]>(`/admin/users?${params.toString()}`);
    if (res.success && res.data) {
      setUsers(res.data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const res = await apiFetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ accountStatus: newStatus }),
    });

    if (res.success) {
      fetchUsers();
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setMessage(null);

    const res = await apiFetch(`/admin/users/${deleteTarget.id}`, {
      method: 'DELETE',
    });

    setIsDeleting(false);
    setDeleteTarget(null);

    if (res.success) {
      setMessage({ type: 'success', text: `Account for ${deleteTarget.name} deleted successfully.` });
      fetchUsers();
    } else {
      setMessage({ type: 'error', text: res.error?.message || 'Failed to delete account.' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Student User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Review student accounts, verification status, and moderation.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search & Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Student</th>
              <th className="py-3.5 px-4">College</th>
              <th className="py-3.5 px-4">Verification</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                  {u.college?.name}
                </td>
                <td className="py-3.5 px-4">
                  {u.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Unverified</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      u.accountStatus === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {u.accountStatus}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleToggleStatus(u.id, u.accountStatus)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      u.accountStatus === 'ACTIVE'
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                  </button>

                  <button
                    onClick={() => setDeleteTarget(u)}
                    className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-xl border border-rose-200 transition"
                    title="Delete Account & Data"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Student Account?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
            </p>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-900 font-medium">
              ⚠️ <strong>Warning:</strong> This action will permanently remove all associated intents, group memberships, ratings, reports, blocks, and notifications for this student.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
