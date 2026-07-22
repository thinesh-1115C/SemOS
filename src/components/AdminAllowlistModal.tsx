import React, { useState } from 'react';
import { 
  ShieldCheck, UserPlus, Trash2, X, Check, Lock, Unlock, Sparkles, Mail, UserCheck, ToggleLeft, ToggleRight
} from 'lucide-react';
import { 
  getAllowedEmails, addAllowedEmail, removeAllowedEmail, 
  isAllowlistEnabled, setAllowlistEnabled, getAccessRequests, updateAccessRequestStatus 
} from '../lib/authGuard';

interface AdminAllowlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAllowlistModal: React.FC<AdminAllowlistModalProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<string[]>(getAllowedEmails());
  const [allowlistActive, setAllowlistActive] = useState<boolean>(isAllowlistEnabled());
  const [newEmail, setNewEmail] = useState('');
  const [requests, setRequests] = useState(getAccessRequests());
  const [activeTab, setActiveTab] = useState<'approved' | 'requests'>('approved');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleAllowlist = () => {
    const nextState = !allowlistActive;
    setAllowlistActive(nextState);
    setAllowlistEnabled(nextState);
    showFeedback(nextState ? 'Invite-Only Mode Activated' : 'Public Multi-Tenant Mode Activated (Anyone can sign in)');
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail) {
      const added = addAllowedEmail(newEmail);
      if (added) {
        setEmails(getAllowedEmails());
        setNewEmail('');
        showFeedback(`Added ${newEmail} to Whitelist`);
      } else {
        showFeedback(`Email already exists or is invalid`);
      }
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    removeAllowedEmail(emailToRemove);
    setEmails(getAllowedEmails());
    showFeedback(`Removed ${emailToRemove}`);
  };

  const handleApproveRequest = (reqId: string) => {
    updateAccessRequestStatus(reqId, 'approved');
    setEmails(getAllowedEmails());
    setRequests(getAccessRequests());
    showFeedback(`Approved request & added email`);
  };

  const handleRejectRequest = (reqId: string) => {
    updateAccessRequestStatus(reqId, 'rejected');
    setRequests(getAccessRequests());
    showFeedback(`Rejected request`);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#FBFBF9] border border-[#EAE7E0] rounded-3xl p-6 shadow-2xl text-[#1A1A1A] space-y-5 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE7E0] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#A68942]" />
            <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
              Authorization Guard & Whitelist Manager
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F6F4F0] text-zinc-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="p-3 rounded-2xl bg-[#1A1A1A] text-[#FBFBF9] text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-[#A68942]" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Mode Toggle Banner */}
        <div className="p-4 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {allowlistActive ? <Lock className="w-4 h-4 text-rose-600" /> : <Unlock className="w-4 h-4 text-emerald-600" />}
              <span className="font-serif font-bold text-sm text-[#1A1A1A]">
                {allowlistActive ? 'Invite-Only Whitelist Mode' : 'Public Multi-Tenant Mode'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              {allowlistActive 
                ? 'Only pre-approved email addresses can sign in.' 
                : 'Anyone can sign in with Google or Email. Data is securely isolated per user UID.'}
            </p>
          </div>

          <button
            onClick={handleToggleAllowlist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] font-bold text-xs hover:bg-[#333333] transition-all shrink-0"
          >
            {allowlistActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-zinc-400" />}
            <span>{allowlistActive ? 'Enabled' : 'Public Access'}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#EAE7E0] text-xs">
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 py-2 font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'approved'
                ? 'border-[#1A1A1A] text-[#1A1A1A]'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#A68942]" />
            <span>Approved Emails ({emails.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'requests'
                ? 'border-[#1A1A1A] text-[#1A1A1A]'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Mail className="w-4 h-4 text-rose-500" />
            <span>Pending Requests ({requests.filter(r => r.status === 'pending').length})</span>
          </button>
        </div>

        {/* Approved Emails Tab */}
        {activeTab === 'approved' && (
          <div className="space-y-4 text-xs">
            {/* Add Form */}
            <form onSubmit={handleAddEmail} className="flex gap-2">
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newstudent@university.edu"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold flex items-center gap-1.5 shadow-xs transition-all shrink-0"
              >
                <UserPlus className="w-4 h-4 text-[#A68942]" />
                <span>Add Email</span>
              </button>
            </form>

            {/* List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {emails.map((e) => (
                <div
                  key={e}
                  className="p-3 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono text-xs font-semibold text-[#1A1A1A]">{e}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveEmail(e)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove from allowlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-3 text-xs max-h-64 overflow-y-auto pr-1">
            {requests.length === 0 ? (
              <p className="text-center py-6 text-zinc-400 font-mono">No pending access requests.</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#1A1A1A]">{req.name}</span>
                      <span className="block font-mono text-[11px] text-zinc-500">{req.email}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>

                  {req.reason && (
                    <p className="text-[11px] text-zinc-600 italic bg-[#FBFBF9] p-2 rounded-xl border border-[#EAE7E0]">
                      "{req.reason}"
                    </p>
                  )}

                  {req.status === 'pending' && (
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold text-[11px] hover:bg-rose-200"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="px-3 py-1 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] font-bold text-[11px] hover:bg-[#333333] flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Approve & Add</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
