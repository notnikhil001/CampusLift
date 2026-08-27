import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import {
  ShieldCheck,
  Building,
  GraduationCap,
  Star,
  CheckCircle,
  UserX,
  Lock,
  Phone,
} from 'lucide-react';

interface BlockedUser {
  id: string;
  blockedUser: {
    id: string;
    name: string;
    course?: string;
    year?: string;
  };
}

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);

  const fetchBlocks = async () => {
    const res = await apiFetch<BlockedUser[]>('/safety/blocks');
    if (res.success && res.data) {
      setBlocks(res.data);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleUnblock = async (blockedUserId: string) => {
    const res = await apiFetch(`/safety/blocks/${blockedUserId}`, { method: 'DELETE' });
    if (res.success) {
      fetchBlocks();
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-indigo-100 border-4 border-white">
            {user.name.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{user.name}</h1>
              {user.isVerified && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Student
                </span>
              )}
            </div>

            <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 mt-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Building className="w-4 h-4 text-slate-400" />
                {user.college?.name}
              </span>
              {user.course && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  {user.course} ({user.year})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
          <div className="bg-slate-50 p-4 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-extrabold text-2xl">
              <Star className="w-6 h-6 fill-current" />
              <span>{user.rating || 5.0}</span>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 block">
              Travel Rating ({user.ratingCount || 0})
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-indigo-600 font-extrabold text-2xl">
              <CheckCircle className="w-6 h-6" />
              <span>{user.completedTripsCount || 0}</span>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 block">
              Completed Shared Trips
            </span>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>Phone number ({user.phoneNumber || 'Not provided'}) is kept strictly private by default.</span>
          </div>
          <span className="font-bold text-slate-800">Private</span>
        </div>
      </div>

      {/* Blocked Users Settings */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <UserX className="w-4 h-4 text-rose-500" />
          Blocked Users ({blocks.length})
        </h3>

        {blocks.length === 0 ? (
          <p className="text-xs text-slate-500">You have not blocked any users.</p>
        ) : (
          <div className="space-y-2">
            {blocks.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/60"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{b.blockedUser.name}</h4>
                  <p className="text-xs text-slate-500">
                    {b.blockedUser.course} · {b.blockedUser.year}
                  </p>
                </div>
                <button
                  onClick={() => handleUnblock(b.blockedUser.id)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
