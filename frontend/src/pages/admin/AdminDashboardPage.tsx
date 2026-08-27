import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import {
  Users,
  ShieldCheck,
  Compass,
  Car,
  Calendar,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface Metrics {
  totalStudents: number;
  verifiedStudents: number;
  activeIntents: number;
  activeGroups: number;
  tripsToday: number;
  completedTrips: number;
  openReports: number;
}

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    apiFetch<Metrics>('/admin/metrics').then((res) => {
      if (res.success && res.data) setMetrics(res.data);
    });
  }, []);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          System analytics and active travel metrics across colleges.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.totalStudents}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Students</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.verifiedStudents}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Intents</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.activeIntents}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Groups</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.activeGroups}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trips Today</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.tripsToday}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Trips</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.completedTrips}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Safety Reports</span>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{metrics.openReports}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
