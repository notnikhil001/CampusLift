import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { TravelGroup } from '../types';
import { GroupCard } from '../components/GroupCard';
import { RatingModal } from '../components/RatingModal';
import { SkeletonCard, EmptyState } from '../components/SkeletonLoader';
import { Clock, CheckCircle, Star } from 'lucide-react';

export const MyTripsPage: React.FC = () => {
  const [tab, setTab] = useState<'UPCOMING' | 'ACTIVE' | 'HISTORY'>('UPCOMING');
  const [tripsData, setTripsData] = useState<{
    upcoming: TravelGroup[];
    active: TravelGroup[];
    history: TravelGroup[];
  }>({
    upcoming: [],
    active: [],
    history: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Rating Modal state
  const [ratingTarget, setRatingTarget] = useState<{
    tripId: string;
    ratedUserId: string;
    ratedUserName: string;
  } | null>(null);

  const fetchTrips = async () => {
    setIsLoading(true);
    const res = await apiFetch<{
      upcoming: TravelGroup[];
      active: TravelGroup[];
      history: TravelGroup[];
    }>('/trips/my-trips');
    setIsLoading(false);

    if (res.success && res.data) {
      setTripsData(res.data);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const currentList =
    tab === 'UPCOMING'
      ? tripsData.upcoming
      : tab === 'ACTIVE'
      ? tripsData.active
      : tripsData.history;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Trips</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your upcoming, active, and completed travel groups.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setTab('UPCOMING')}
          className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            tab === 'UPCOMING'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Upcoming ({tripsData.upcoming.length})
        </button>

        <button
          onClick={() => setTab('ACTIVE')}
          className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            tab === 'ACTIVE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Active Today ({tripsData.active.length})
        </button>

        <button
          onClick={() => setTab('HISTORY')}
          className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            tab === 'HISTORY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          History ({tripsData.history.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
        </div>
      ) : currentList.length === 0 ? (
        <EmptyState
          title={`No ${tab.toLowerCase()} trips found`}
          description="Join an existing group or post a travel intent from the home feed."
        />
      ) : (
        <div className="space-y-4">
          {currentList.map((group) => (
            <div key={group.id} className="space-y-2">
              <GroupCard group={group} />

              {/* Rating Button for History tab */}
              {tab === 'HISTORY' && group.trips && group.trips.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-indigo-900">
                    Did you travel with fellow members in this group?
                  </span>
                  <div className="flex items-center gap-2">
                    {group.members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() =>
                          setRatingTarget({
                            tripId: group.trips![0].id,
                            ratedUserId: m.user.id,
                            ratedUserName: m.user.name,
                          })
                        }
                        className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        Rate {m.user.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {ratingTarget && (
        <RatingModal
          tripId={ratingTarget.tripId}
          ratedUserId={ratingTarget.ratedUserId}
          ratedUserName={ratingTarget.ratedUserName}
          onClose={() => setRatingTarget(null)}
          onSuccess={() => fetchTrips()}
        />
      )}
    </div>
  );
};
