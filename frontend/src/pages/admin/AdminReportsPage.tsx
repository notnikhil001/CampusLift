import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { Report } from '../../types';
import { AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchReports = async () => {
    const res = await apiFetch<Report[]>('/admin/reports');
    if (res.success && res.data) setReports(res.data);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (status: 'INVESTIGATING' | 'RESOLVED' | 'REJECTED') => {
    if (!selectedReport) return;
    const res = await apiFetch(`/admin/reports/${selectedReport.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    });

    if (res.success) {
      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Safety &amp; Moderation Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Investigate user and group safety reports submitted by students.</p>
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                  Category: {r.category}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Reported by <strong>{r.reporter.name}</strong> ({r.reporter.email}) on{' '}
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  r.status === 'OPEN'
                    ? 'bg-rose-100 text-rose-800'
                    : r.status === 'INVESTIGATING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {r.status}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
              &ldquo;{r.description}&rdquo;
            </p>

            {r.reportedUser && (
              <div className="text-xs text-slate-600">
                Target User: <strong>{r.reportedUser.name}</strong> ({r.reportedUser.email})
              </div>
            )}

            {r.adminNotes && (
              <div className="text-xs text-indigo-900 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 font-medium">
                Admin Notes: {r.adminNotes}
              </div>
            )}

            <button
              onClick={() => {
                setSelectedReport(r);
                setAdminNotes(r.adminNotes || '');
              }}
              className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Action Report
            </button>
          </div>
        ))}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Resolve Safety Report</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Admin Audit Notes
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Describe resolution or action taken..."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-3 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve('INVESTIGATING')}
                className="px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl"
              >
                Set Investigating
              </button>
              <button
                onClick={() => handleResolve('REJECTED')}
                className="px-3 py-2 bg-slate-600 text-white text-xs font-bold rounded-xl"
              >
                Reject
              </button>
              <button
                onClick={() => handleResolve('RESOLVED')}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Resolve Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
