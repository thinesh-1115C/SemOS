import React, { useState } from 'react';
import { ShieldAlert, Send, Key, CheckCircle2, Lock, UserPlus, X, Sparkles, UserCheck } from 'lucide-react';
import { submitAccessRequest, addAllowedEmail, getAllowedEmails, removeAllowedEmail, isAllowlistEnabled, setAllowlistEnabled } from '../lib/authGuard';

interface AccessRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptedEmail: string | null;
  onOpenAdmin: () => void;
}

export const AccessRestrictedModal: React.FC<AccessRestrictedModalProps> = ({
  isOpen,
  onClose,
  attemptedEmail,
  onOpenAdmin,
}) => {
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (attemptedEmail) {
      submitAccessRequest(attemptedEmail, attemptedEmail.split('@')[0], reason);
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#FBFBF9] border border-rose-200 rounded-3xl p-6 shadow-2xl text-[#1A1A1A] space-y-5 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl bg-[#F6F4F0] hover:bg-[#EAE7E0] text-zinc-500"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Badge & Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h2 className="font-serif font-bold text-xl text-[#1A1A1A]">
            Access Restricted
          </h2>
          <p className="text-xs text-zinc-600 max-w-xs mx-auto">
            This application is currently in <strong className="text-rose-700">Invite-Only Mode</strong>. Your email is not on the approved access list.
          </p>
        </div>

        {/* Attempted Email Display */}
        {attemptedEmail && (
          <div className="p-3.5 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] font-mono text-xs flex items-center justify-between">
            <div className="truncate">
              <span className="text-zinc-400 block text-[10px]">Attempted Account:</span>
              <span className="font-bold text-[#1A1A1A]">{attemptedEmail}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
              Unapproved
            </span>
          </div>
        )}

        {/* Request Form or Submitted Message */}
        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="font-serif font-bold text-sm text-emerald-950">
              Access Request Submitted!
            </h3>
            <p className="text-xs text-emerald-800">
              The application owner has received your request. Once approved, you can sign in directly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Reason for Access Request (Optional)
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Student in CS302 studying for midterm exams..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942] text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-[#A68942]" />
              <span>Request Invite Approval</span>
            </button>
          </form>
        )}

        {/* Admin Switcher Link */}
        <div className="pt-2 border-t border-[#EAE7E0] flex items-center justify-between text-xs">
          <span className="text-zinc-500 text-[11px]">Are you the App Administrator?</span>
          <button
            onClick={() => {
              onClose();
              onOpenAdmin();
            }}
            className="text-[#A68942] font-bold hover:underline flex items-center gap-1"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Manage Allowlist</span>
          </button>
        </div>

      </div>
    </div>
  );
};
