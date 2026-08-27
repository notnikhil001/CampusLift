import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { Location, TravelGroup, TravelIntent } from '../types';
import { GroupCard } from '../components/GroupCard';
import { IntentCard } from '../components/IntentCard';
import { SkeletonCard, EmptyState } from '../components/SkeletonLoader';
import {
  Compass,
  Building,
  Calendar,
  PlusCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  const [direction, setDirection] = useState<'FROM_CAMPUS' | 'TO_CAMPUS'>('FROM_CAMPUS');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [groups, setGroups] = useState<TravelGroup[]>([]);
  const [intents, setIntents] = useState<TravelIntent[]>([]);
  const [activeTripGroup, setActiveTripGroup] = useState<TravelGroup | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch locations for current user college
  useEffect(() => {
    if (user?.collegeId) {
      apiFetch<Location[]>(`/colleges/${user.collegeId}/locations`).then((res) => {
        if (res.success && res.data) {
          setLocations(res.data);
        }
      });
    }
  }, [user?.collegeId]);

  // Fetch user active trip if any
  useEffect(() => {
    if (user) {
      apiFetch<{ active: TravelGroup[] }>('/trips/my-trips').then((res) => {
        if (res.success && res.data?.active?.length) {
          setActiveTripGroup(res.data.active[0]);
        }
      });
    }
  }, [user]);

  // Fetch Feed based on direction, location, date
  const fetchFeed = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set('direction', direction);
    params.set('date', selectedDate);
    if (selectedLocationId) params.set('locationId', selectedLocationId);

    const res = await apiFetch<{ groups: TravelGroup[]; intents: TravelIntent[] }>(
      `/intents/feed?${params.toString()}`
    );

    setIsLoading(false);
    if (res.success && res.data) {
      setGroups(res.data.groups || []);
      setIntents(res.data.intents || []);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [direction, selectedLocationId, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Campus Travel Coordination</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Where are people going?
          </h1>
          <p className="text-slate-300 text-sm max-w-xl">
            CampusLift helps verified students discover compatible travel timing to share autos &amp; taxis to and from campus.
          </p>

          {/* Direction Filter Toggle */}
          <div className="mt-6 inline-flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/15 gap-1.5">
            <button
              onClick={() => setDirection('FROM_CAMPUS')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
                direction === 'FROM_CAMPUS'
                  ? 'bg-white text-indigo-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building className="w-4 h-4" />
              FROM CAMPUS
            </button>

            <button
              onClick={() => setDirection('TO_CAMPUS')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
                direction === 'TO_CAMPUS'
                  ? 'bg-white text-indigo-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Compass className="w-4 h-4" />
              TO CAMPUS
            </button>
          </div>
        </div>
      </div>

      {/* Active Trip Widget if user has trip today */}
      {activeTripGroup && (
        <div className="bg-emerald-600 text-white rounded-2xl p-5 shadow-lg flex items-center justify-between flex-wrap gap-4 animate-in fade-in">
          <div>
            <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              Your Trip Today
            </span>
            <h3 className="text-lg font-bold mt-2">
              {activeTripGroup.fromLocation.name} &rarr; {activeTripGroup.toLocation.name}
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              {activeTripGroup.date} {activeTripGroup.commonTime ? `at ${activeTripGroup.commonTime}` : ''} · {activeTripGroup.members.length} students
            </p>
          </div>

          <Link
            to={`/groups/${activeTripGroup.id}`}
            className="bg-white text-emerald-800 px-4 py-2.5 rounded-xl text-sm font-bold shadow hover:bg-emerald-50 transition flex items-center gap-1.5"
          >
            Open Active Group
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Location Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {direction === 'FROM_CAMPUS' ? 'Destination' : 'Pickup Location'}
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Locations</option>
              {locations
                .filter((l) => (direction === 'FROM_CAMPUS' ? l.type !== 'CAMPUS' : true))
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to="/create-intent"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-100 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Create Travel Intent
        </Link>
      </div>

      {/* Feed Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Active Travel Groups &amp; Intents</h2>
          <span className="text-xs text-slate-500 font-medium">
            Showing results for {selectedDate}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : groups.length === 0 && intents.length === 0 ? (
          <EmptyState
            title="No travel groups found yet"
            description="Be the first student to create a travel intent on this route and time!"
            actionLabel="+ Create Travel Intent"
            onAction={() => window.location.assign('/create-intent')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Existing Groups */}
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}

            {/* Individual Intents */}
            {intents.map((intent) => (
              <IntentCard key={intent.id} intent={intent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
