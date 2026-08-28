import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Mail, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export const VerificationBanner: React.FC = () => {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!user || user.isVerified) {
    return null;
  }

  const handleResend = async () => {
    if (cooldown > 0 || isSending) return;
    setIsSending(true);
    setResendStatus({ type: null, message: '' });

    try {
      const res = await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: user.email }),
      });

      if (res.success) {
        setResendStatus({
          type: 'success',
          message: res.message || 'Verification email sent! Check your inbox.',
        });
        setCooldown(60); // 60 seconds cooldown
      } else {
        setResendStatus({
          type: 'error',
          message: res.error?.message || 'Failed to resend email.',
        });
      }
    } catch (err: any) {
      setResendStatus({
        type: 'error',
        message: err.message || 'Network error occurred while sending email.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-amber-500 text-slate-900 px-4 py-3 text-sm font-medium shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-slate-950" />
          <span>
            <strong>Action Required:</strong> Please verify your college email address (
            <strong>{user.email}</strong>) to post travel intents or join groups.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {resendStatus.message && (
            <span
              className={`text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 ${
                resendStatus.type === 'success' ? 'bg-emerald-900 text-emerald-100' : 'bg-rose-900 text-rose-100'
              }`}
            >
              {resendStatus.type === 'success' ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {resendStatus.message}
            </span>
          )}

          <button
            onClick={handleResend}
            disabled={isSending || cooldown > 0}
            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-60 disabled:cursor-not-allowed border border-amber-700"
            title="Resend verification email"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
            {isSending
              ? 'Sending...'
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend Email'}
          </button>

          <Link
            to="/verify-email"
            className="inline-flex items-center gap-1 bg-slate-950 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
          >
            <Mail className="w-3.5 h-3.5" />
            Verify Email
          </Link>
        </div>
      </div>
    </div>
  );
};

