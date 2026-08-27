import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { MailCheck, ArrowRight, RefreshCw, Send } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [isResending, setIsResending] = useState(false);
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

  const handleVerify = async (tokenToVerify: string) => {
    if (!tokenToVerify) return;
    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    const res = await apiFetch('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: tokenToVerify }),
    });

    setIsSubmitting(false);

    if (res.success) {
      setStatus({
        type: 'success',
        message: 'Your college email has been verified! Redirecting to Home...',
      });
      await refreshUser();
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } else {
      setStatus({
        type: 'error',
        message: res.error?.message || 'Verification failed. Token may be invalid or expired.',
      });
    }
  };

  const handleResend = async () => {
    const targetEmail = user?.email || emailInput;
    if (!targetEmail) {
      setResendStatus({ type: 'error', message: 'Please enter your registered college email.' });
      return;
    }

    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendStatus({ type: null, message: '' });

    const res = await apiFetch('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail }),
    });

    setIsResending(false);

    if (res.success) {
      setResendStatus({
        type: 'success',
        message: res.message || 'Verification email resent! Please check your college inbox.',
      });
      setCooldown(60);
    } else {
      setResendStatus({
        type: 'error',
        message: res.error?.message || 'Failed to resend verification email.',
      });
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <MailCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Verify College Email</h2>
        <p className="text-sm text-slate-500 mt-1">
          CampusLift requires college email verification to keep our student community safe.
        </p>
      </div>

      {status.message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium mb-6 ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {status.message}
        </div>
      )}

      {!tokenFromUrl && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(tokenInput);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Verification Token
            </label>
            <input
              type="text"
              required
              placeholder="Paste verification token here"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !tokenInput}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying...' : 'Submit Verification Token'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Resend Verification Email Section */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Didn't receive the email?</h3>
        <p className="text-xs text-slate-500 mb-3">
          Check your spam/junk folder or request a new verification link.
        </p>

        {!user && (
          <div className="mb-3">
            <input
              type="email"
              placeholder="Enter your college email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {resendStatus.message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium mb-3 ${
              resendStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {resendStatus.message}
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={isResending || cooldown > 0}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          {isResending
            ? 'Resending Email...'
            : cooldown > 0
            ? `Resend available in ${cooldown}s`
            : 'Resend Verification Email'}
        </button>
      </div>
    </div>
  );
};

