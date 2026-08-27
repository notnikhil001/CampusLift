import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { Location, TravelGroup, MatchScoreResult } from '../types';
import { GroupCard } from '../components/GroupCard';
import {
  MapPin,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const CreateIntentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<Location[]>([]);
  const [fromLocationId, setFromLocationId] = useState<string>('');
  const [toLocationId, setToLocationId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [timeMode, setTimeMode] = useState<'RANGE' | 'FLEXIBLE'>('RANGE');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('08:30');
  const [preferredTime, setPreferredTime] = useState<string>('08:15');
  const [flexibilityMinutes, setFlexibilityMinutes] = useState<number>(15);
  const [note, setNote] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isActioning, setIsActioning] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [createdMatchResult, setCreatedMatchResult] = useState<{
    intent: any;
    matchingGroups: TravelGroup[];
  } | null>(null);

  useEffect(() => {
    if (user?.collegeId) {
      apiFetch<Location[]>(`/colleges/${user.collegeId}/locations`).then((res) => {
        if (res.success && res.data) {
          setLocations(res.data);
          const campus = res.data.find((l) => l.type === 'CAMPUS') || res.data[0];
          const popular = res.data.find((l) => l.type === 'POPULAR') || res.data[1];
          if (campus) setFromLocationId(campus.id);
          if (popular) setToLocationId(popular.id);
        }
      });
    }
  }, [user?.collegeId]);

  // Compute live window text
  const getWindowText = () => {
    if (timeMode === 'RANGE') {
      return `Every student traveling anytime between ${startTime} and ${endTime} will be matched with you.`;
    } else {
      return `Your preferred travel time is ${preferredTime}, flexible by ±${flexibilityMinutes} minutes. Effective window: ${preferredTime} (${flexibilityMinutes}m flex).`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromLocationId === toLocationId) {
      setError('Pickup location and Destination cannot be the same');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload = {
      fromLocationId,
      toLocationId,
      date,
      timeMode,
      ...(timeMode === 'RANGE'
        ? { startTime, endTime }
        : { preferredTime, flexibilityMinutes: Number(flexibilityMinutes) }),
      note,
    };

    const res = await apiFetch<{ intent: any; matchingGroups: TravelGroup[] }>('/intents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      const { intent: createdIntent, matchingGroups } = res.data;
      setCreatedMatchResult({
        intent: createdIntent,
        matchingGroups: matchingGroups || [],
      });
    } else {
      setError(res.error?.message || 'Failed to create travel intent');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!createdMatchResult || isActioning) return;
    setIsActioning(true);
    setActionError('');

    const res = await apiFetch<{ groupId: string }>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({
        groupId,
        intentId: createdMatchResult.intent.id,
      }),
    });

    setIsActioning(false);

    if (res.success && res.data?.groupId) {
      navigate(`/groups/${res.data.groupId}`);
    } else {
      setActionError(res.error?.message || 'Failed to join group. Please try again.');
    }
  };

  const handleCreateOwnGroup = async () => {
    if (!createdMatchResult || isActioning) return;
    setIsActioning(true);
    setActionError('');

    const res = await apiFetch<{ groupId: string }>('/groups/create', {
      method: 'POST',
      body: JSON.stringify({
        intentId: createdMatchResult.intent.id,
      }),
    });

    setIsActioning(false);

    if (res.success && res.data?.groupId) {
      navigate(`/groups/${res.data.groupId}`);
    } else {
      setActionError(res.error?.message || 'Failed to create group. Please try again.');
    }
  };

  if (createdMatchResult) {
    const { intent: myIntent, matchingGroups } = createdMatchResult;

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in fade-in">
        {/* Success Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-emerald-900 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
            <h2 className="text-xl font-bold">Travel Intent Saved!</h2>
          </div>
          <p className="text-sm text-emerald-700">
            Your travel intent for {myIntent.date} ({myIntent.fromLocation?.name} &rarr; {myIntent.toLocation?.name}) is active.
          </p>
        </div>

        {actionError && (
          <div className="bg-rose-50 text-rose-700 text-sm p-4 rounded-2xl border border-rose-200">
            {actionError}
          </div>
        )}

        {/* Create Your Own Group Header Action Card */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold">Start a New Travel Group</h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              Be the leader and let other students discover and join your group.
            </p>
          </div>
          <button
            onClick={handleCreateOwnGroup}
            disabled={isActioning}
            className="px-5 py-3 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-sm rounded-xl transition shadow flex items-center gap-2 disabled:opacity-50"
          >
            {isActioning ? (
              'Processing...'
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-500" />
                Create Your Own Group
              </>
            )}
          </button>
        </div>

        {/* Existing Compatible Groups List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Matching Existing Groups ({matchingGroups.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Join an existing group or create your own
            </span>
          </div>

          {matchingGroups.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">No matching groups found</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                There are no existing open groups for this route and date yet. You can create your own group now so other students can join you!
              </p>
              <div className="pt-2">
                <button
                  onClick={handleCreateOwnGroup}
                  disabled={isActioning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md disabled:opacity-50"
                >
                  {isActioning ? 'Creating Group...' : 'Create Your Own Group Now'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {matchingGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        {group.date} {group.commonTime ? `· ${group.commonTime}` : ''}
                      </span>
                      <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">
                        {group.fromLocation.name} &rarr; {group.toLocation.name}
                      </h4>
                    </div>

                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                      {group.members?.length || 0} Members
                    </span>
                  </div>

                  {/* Members preview */}
                  {group.members && group.members.length > 0 && (
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Group Members:
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {group.members.map((m) => (
                          <div key={m.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                              {m.user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{m.user.name}</span>
                            {m.user.course && (
                              <span className="text-slate-400 font-normal">({m.user.course})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Join Group Button */}
                  <div className="pt-1 flex justify-end">
                    {group.isMember ? (
                      <button
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="px-5 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl border border-emerald-200 hover:bg-emerald-100 transition"
                      >
                        View My Group
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={isActioning}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isActioning ? 'Joining...' : 'Join This Group'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Create Travel Intent</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tell fellow students when and where you want to travel to form an auto/taxi group.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 text-sm p-4 rounded-2xl border border-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Origin and Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              From (Pickup Location)
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-indigo-600 absolute left-3.5 top-3" />
              <select
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type === 'CAMPUS' ? 'Campus' : 'Popular'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              To (Destination)
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-indigo-600 absolute left-3.5 top-3" />
              <select
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type === 'CAMPUS' ? 'Campus' : 'Popular'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Travel Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Travel Date
          </label>
          <div className="relative">
            <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Time Mode Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Time Preference Mode
          </label>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setTimeMode('RANGE')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                timeMode === 'RANGE'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm font-bold">OPTION 1: Time Range</div>
              <div className="text-xs text-slate-500 font-normal mt-0.5">
                e.g. &ldquo;Anytime between 8:00 AM and 8:30 AM&rdquo;
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTimeMode('FLEXIBLE')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                timeMode === 'FLEXIBLE'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm font-bold">OPTION 2: Flexible Time</div>
              <div className="text-xs text-slate-500 font-normal mt-0.5">
                e.g. &ldquo;8:15 AM, flexible by 15 mins&rdquo;
              </div>
            </button>
          </div>

          {/* Time Inputs */}
          {timeMode === 'RANGE' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Earliest Start Time</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Latest End Time</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Time</label>
                <input
                  type="time"
                  required
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Flexible By</label>
                <select
                  value={flexibilityMinutes}
                  onChange={(e) => setFlexibilityMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Visual Time Window Explanation */}
        <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3 text-xs text-indigo-900">
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Matching Window Calculation:</strong>
            {getWindowText()}
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Optional Note for Fellow Students
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Catching a 6:15 PM train. Looking to split an auto fare."
            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Travel Intent...' : 'Create Travel Intent & Find Matches'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
