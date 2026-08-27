import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { Location, College } from '../../types';
import { MapPin, Plus, X } from 'lucide-react';

export const AdminLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [collegeId, setCollegeId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'CAMPUS' | 'POPULAR'>('POPULAR');
  const [error, setError] = useState('');

  const fetchData = async () => {
    const resLoc = await apiFetch<Location[]>('/admin/locations');
    if (resLoc.success && resLoc.data) setLocations(resLoc.data);

    const resCol = await apiFetch<College[]>('/admin/colleges');
    if (resCol.success && resCol.data) {
      setColleges(resCol.data);
      if (resCol.data.length > 0) setCollegeId(resCol.data[0].id);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/admin/locations', {
      method: 'POST',
      body: JSON.stringify({ collegeId, name, description, type }),
    });

    if (res.success) {
      setShowModal(false);
      setName('');
      setDescription('');
      fetchData();
    } else {
      setError(res.error?.message || 'Failed to create location');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Predefined Popular Locations</h1>
          <p className="text-sm text-slate-500 mt-1">Configure campus gates, stations, bus terminals, airports.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  loc.type === 'CAMPUS'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {loc.type}
              </span>
              <span className="text-xs font-semibold text-slate-400">{loc.college?.name}</span>
            </div>
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              {loc.name}
            </h3>
            {loc.description && <p className="text-xs text-slate-500">{loc.description}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900">Add Predefined Location</h3>

            {error && <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl">{error}</div>}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  College
                </label>
                <select
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Railway Station"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="CAMPUS">CAMPUS</option>
                  <option value="POPULAR">POPULAR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Platform 1 Taxi Bay"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-sm">
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
