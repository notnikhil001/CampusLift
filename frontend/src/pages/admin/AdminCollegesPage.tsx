import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { College } from '../../types';
import { Building, Plus, X } from 'lucide-react';

export const AdminCollegesPage: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [logo, setLogo] = useState('');
  const [error, setError] = useState('');

  const fetchColleges = async () => {
    const res = await apiFetch<College[]>('/admin/colleges');
    if (res.success && res.data) setColleges(res.data);
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/admin/colleges', {
      method: 'POST',
      body: JSON.stringify({ name, emailDomain, logo }),
    });

    if (res.success) {
      setShowModal(false);
      setName('');
      setEmailDomain('');
      setLogo('');
      fetchColleges();
    } else {
      setError(res.error?.message || 'Failed to create college');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">College Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure partner institutions &amp; verified email domains.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add College
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {colleges.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center border border-indigo-100">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{c.name}</h3>
                <span className="text-xs font-semibold text-indigo-600">@{c.emailDomain}</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
              <span>{c._count?.users || 0} Registered Students</span>
              <span>{c._count?.locations || 0} Locations</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900">Add New College</h3>

            {error && <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl">{error}</div>}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  College Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chitkara University"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Domain
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. chitkarauniversity.edu.in"
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-sm">
                  Save College
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
