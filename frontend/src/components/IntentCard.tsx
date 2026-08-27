import React from 'react';
import { TravelIntent } from '../types';
import { User, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

interface IntentCardProps {
  intent: TravelIntent;
  onJoinClick?: () => void;
}

export const IntentCard: React.FC<IntentCardProps> = ({ intent, onJoinClick }) => {
  const timeDisplay =
    intent.timeMode === 'RANGE'
      ? `${intent.startTime} – ${intent.endTime}`
      : `${intent.preferredTime} (±${intent.flexibilityMinutes}m)`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition group">
      {/* Route Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <span className="text-indigo-600">{intent.fromLocation.name}</span>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{intent.toLocation.name}</span>
        </div>
        <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          Looking for people
        </span>
      </div>

      {/* Student Details */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
          {intent.creator.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-900">{intent.creator.name}</span>
            {intent.creator.isVerified && (
              <span title="Verified Student">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </span>
            )}
          </div>
          {intent.creator.course && (
            <span className="text-xs text-slate-500">
              {intent.creator.course} · {intent.creator.year}
            </span>
          )}
        </div>
      </div>

      {/* Date and Time */}
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl">
        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          {intent.date} · <strong>{timeDisplay}</strong>
        </span>
      </div>

      {intent.note && (
        <p className="text-xs text-slate-600 italic mb-4 line-clamp-2">&ldquo;{intent.note}&rdquo;</p>
      )}

      {/* Action Button */}
      {onJoinClick && (
        <button
          onClick={onJoinClick}
          className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
        >
          Form Group with {intent.creator.name.split(' ')[0]}
        </button>
      )}
    </div>
  );
};
