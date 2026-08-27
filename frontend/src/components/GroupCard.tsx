import React from 'react';
import { Link } from 'react-router-dom';
import { TravelGroup } from '../types';
import { Users, Clock, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

interface GroupCardProps {
  group: TravelGroup;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const activeMembersCount = group.members.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition group">
      {/* Route Badge Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <span className="text-indigo-600">{group.fromLocation.name}</span>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{group.toLocation.name}</span>
        </div>
        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
          <Users className="w-3.5 h-3.5" />
          {activeMembersCount} {activeMembersCount === 1 ? 'Student' : 'Students'}
        </span>
      </div>

      {/* Details Row */}
      <div className="space-y-2 text-sm text-slate-600 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>
            {group.date} {group.commonTime ? `· ${group.commonTime}` : ''}
          </span>
        </div>

        {group.meetingPoint && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 font-medium">
              Meeting Point: {group.meetingPoint.name}
            </span>
          </div>
        )}
      </div>

      {/* Member Avatars */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
        <div className="flex items-center -space-x-2">
          {group.members.slice(0, 4).map((m) => (
            <div
              key={m.id}
              className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white text-xs font-bold text-slate-700 flex items-center justify-center overflow-hidden"
              title={m.user.name}
            >
              {m.user.name.slice(0, 2).toUpperCase()}
            </div>
          ))}
          {group.members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white text-[10px] font-bold text-slate-500 flex items-center justify-center">
              +{group.members.length - 4}
            </div>
          )}
        </div>

        <Link
          to={`/groups/${group.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 hover:underline"
        >
          View Group &rarr;
        </Link>
      </div>
    </div>
  );
};
