import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface ReportModalProps {
  reportedUserId?: string;
  groupId?: string;
  targetName?: string;
  onClose: () => void;
}

const CATEGORIES = [
  'Harassment',
  'Fake profile',
  'Suspicious behavior',
  'Inappropriate content',
  'Spam',
  'Other',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  reportedUserId,
  groupId,
  targetName,
  onClose,
}) => {
  const [category, setCategory] = useState<string>('Harassment');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const res = await apiFetch('/safety/reports', {
      method: 'POST',
      body: JSON.stringify({
        reportedUserId,
        groupId,
        category,
        description,
      }),
    });

    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(res.error?.message || 'Failed to submit report');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-rose-600 mb-2">
          <Flag className="w-5 h-5" />
          <h3 className="text-xl font-bold text-slate-900">Report Safety Issue</h3>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-center text-sm font-medium border border-emerald-200 my-4">
            ✓ Report submitted successfully. Our safety team will review this promptly.
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-4">
              Report {targetName ? <strong>{targetName}</strong> : 'this user/group'} for violating CampusLift safety guidelines.
            </p>

            {error && (
              <div className="bg-rose-50 text-rose-700 text-sm p-3 rounded-xl mb-4 border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide specific details about what happened..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                  minLength={10}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || description.length < 10}
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
