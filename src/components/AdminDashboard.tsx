import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Activity, Search, RefreshCw, Key, Lock, Unlock, 
  CheckCircle2, Clock, AlertTriangle, Eye, Sparkles, Filter, ShieldAlert,
  UserCheck, Trash2, Mail, ExternalLink, ArrowUpRight, Monitor, Laptop, Check, X
} from 'lucide-react';
import { 
  subscribeToOnlineUsers, getOnlineUsers, subscribeToAccessRequests 
} from '../lib/firebase';
import { 
  getAllowedEmails, isAllowlistEnabled, setAllowlistEnabled, 
  getAccessRequests, updateAccessRequestStatus, addAllowedEmail, removeAllowedEmail,
  syncAccessRequestsFromCloud, syncAllowlistFromCloud, subscribeToAllowlistSync
} from '../lib/authGuard';

interface AdminDashboardProps {
  onOpenAllowlistModal: () => void;
  setActiveView?: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onOpenAllowlistModal,
  setActiveView 
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFilter, setViewFilter] = useState('all');
  const [allowedEmails, setAllowedEmails] = useState<string[]>(getAllowedEmails());
  const [allowlistActive, setAllowlistActive] = useState<boolean>(isAllowlistEnabled());
  const [accessRequests, setAccessRequests] = useState<any[]>(getAccessRequests());
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [newEmail, setNewEmail] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync state & setup real-time subscriptions
  useEffect(() => {
    // 1. Initial Cloud Sync
    syncAllowlistFromCloud().then(() => {
      setAllowedEmails(getAllowedEmails());
      setAllowlistActive(isAllowlistEnabled());
    }).catch(err => console.error(err));

    syncAccessRequestsFromCloud().then((reqs) => {
      setAccessRequests(reqs);
    }).catch(err => console.error(err));

    // 2. Real-time online users subscription
    const unsubOnline = subscribeToOnlineUsers((onlineData) => {
      setUsers(onlineData);
      setLoading(false);
      setLastRefreshed(new Date());
    });

    // Fallback one-time fetch
    getOnlineUsers().then(data => {
      setUsers(data);
      setLoading(false);
    });

    // 3. Real-time access requests subscription
    const unsubRequests = subscribeToAccessRequests((cloudReqs) => {
      const local = getAccessRequests();
      const mergedMap = new Map<string, any>();
      for (const r of [...local, ...(cloudReqs || [])]) {
        const key = r.id || r.email;
        const existing = mergedMap.get(key);
        mergedMap.set(key, existing ? { ...existing, ...r } : r);
      }
      const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
      const merged = Array.from(mergedMap.values()).sort((a, b) => {
        if ((statusOrder[a.status] ?? 99) !== (statusOrder[b.status] ?? 99)) {
          return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
        }
        return new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime();
      });
      setAccessRequests(merged);
    });

    // 4. Real-time allowlist config subscription
    const unsubAllowlist = subscribeToAllowlistSync();

    return () => {
      unsubOnline();
      unsubRequests();
      unsubAllowlist();
    };
  }, []);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleAllowlist = () => {
    const nextState = !allowlistActive;
    setAllowlistActive(nextState);
    setAllowlistEnabled(nextState);
    showToast(nextState ? 'Activated Invite-Only Whitelist Mode' : 'Activated Public Multi-Tenant Mode');
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    const added = addAllowedEmail(newEmail.trim());
    if (added) {
      setAllowedEmails(getAllowedEmails());
      setNewEmail('');
      showToast(`Added ${newEmail.trim()} to access list`);
    } else {
      showToast('Email already in list or invalid');
    }
  };

  const handleRemoveEmail = (email: string) => {
    removeAllowedEmail(email);
    setAllowedEmails(getAllowedEmails());
    showToast(`Removed ${email}`);
  };

  const handleApproveRequest = (reqId: string) => {
    updateAccessRequestStatus(reqId, 'approved');
    setAccessRequests(getAccessRequests());
    setAllowedEmails(getAllowedEmails());
    showToast('Approved access request!');
  };

  const handleRejectRequest = (reqId: string) => {
    updateAccessRequestStatus(reqId, 'rejected');
    setAccessRequests(getAccessRequests());
    showToast('Rejected access request.');
  };

  // Helper to format view display names
  const getViewBadge = (view: string) => {
    const viewMap: Record<string, { label: string; color: string }> = {
      'dashboard': { label: 'Dashboard', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      'timetable': { label: 'Timetable & Attendance', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'ai-tutor': { label: 'AI Tutor Hub', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      'study-planner': { label: 'AI Study Planner', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      'flashcards': { label: 'Flashcards (Anki)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      'quiz-generator': { label: 'Quiz Generator', color: 'bg-rose-100 text-rose-800 border-rose-200' },
      'pdf-brain': { label: 'Inbuilt File Library', color: 'bg-teal-100 text-teal-800 border-teal-200' },
      'calendar': { label: 'Revision Planner', color: 'bg-[#A68942]/15 text-[#A68942] border-[#A68942]/30' },
      'writing-assistant': { label: 'Writing Assistant', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'analytics': { label: 'Progress & XP', color: 'bg-sky-100 text-sky-800 border-sky-200' },
      'subject': { label: 'Subject View', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
    };
    const mapped = viewMap[view] || { label: view || 'Active Workspace', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' };
    return mapped;
  };

  // Format relative time for lastSeen
  const formatLastSeen = (lastSeen: any) => {
    if (!lastSeen) return 'Active now';
    let dateObj: Date;
    if (lastSeen.seconds) {
      dateObj = new Date(lastSeen.seconds * 1000);
    } else if (typeof lastSeen === 'string' || typeof lastSeen === 'number') {
      dateObj = new Date(lastSeen);
    } else {
      return 'Active now';
    }
    const diffSec = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
    if (diffSec < 30) return 'Active just now';
    if (diffSec < 120) return '1 min ago';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchQuery = 
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.currentView || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchView = viewFilter === 'all' || u.currentView === viewFilter;
    return matchQuery && matchView;
  });

  const pendingRequestsCount = accessRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#1A1A1A] text-[#FBFBF9] border border-[#A68942]/40 shadow-2xl flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-[#A68942]" />
          <span className="text-xs font-bold">{feedback}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#F6F4F0] border border-[#EAE7E0] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#A68942]/15 text-[#A68942] border border-[#A68942]/30 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Firestore Presence Engine
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            System & User Admin Dashboard
          </h1>
          <p className="text-xs text-zinc-600">
            Monitor live active user sessions, view accessed workspace features in real-time, and manage access authorizations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAllowlistModal}
            className="px-4 py-2.5 rounded-2xl bg-[#1A1A1A] text-[#FBFBF9] font-bold text-xs hover:bg-[#333333] transition-all shadow-md flex items-center gap-2"
            id="admin-open-allowlist-modal-btn"
          >
            <Key className="w-4 h-4 text-[#A68942]" />
            <span>Manage Access Whitelist</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Online Users */}
        <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Active Online Users</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1A1A1A]">{users.length}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live connected
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">Across all active browser tabs & devices</p>
        </div>

        {/* Metric 2: Access Security Mode */}
        <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Access Control Mode</span>
            <button 
              onClick={handleToggleAllowlist}
              className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-colors ${
                allowlistActive ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}
              title="Click to toggle Security Mode"
            >
              {allowlistActive ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-serif font-bold text-[#1A1A1A]">
              {allowlistActive ? 'Invite-Only Mode' : 'Public Mode'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            {allowlistActive ? 'Only approved whitelist emails can log in' : 'Any email can register & access'}
          </p>
        </div>

        {/* Metric 3: Whitelisted Emails */}
        <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Allowed Accounts</span>
            <div className="w-9 h-9 rounded-2xl bg-[#A68942]/10 border border-[#A68942]/30 text-[#A68942] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1A1A1A]">{allowedEmails.length}</span>
            <span className="text-xs text-zinc-500 font-semibold">approved emails</span>
          </div>
          <p className="text-[11px] text-zinc-500">Persisted safely in Firestore DB</p>
        </div>

        {/* Metric 4: Pending Access Requests */}
        <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Access Requests</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1A1A1A]">{pendingRequestsCount}</span>
            {pendingRequestsCount > 0 ? (
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                Action required
              </span>
            ) : (
              <span className="text-xs text-emerald-600 font-semibold">All clear</span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500">Total {accessRequests.length} requests received</p>
        </div>

      </div>

      {/* Main Section: Real-time Active Users Table */}
      <div className="bg-[#FBFBF9] border border-[#EAE7E0] rounded-3xl p-6 shadow-sm space-y-5">
        
        {/* Table Filters & Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#EAE7E0] pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#A68942]" />
            <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
              Live Users & Workspace Activity Matrix
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
              {filteredUsers.length} active
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, email or view..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs focus:outline-none focus:border-[#A68942]"
              />
            </div>

            {/* View Filter Dropdown */}
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs font-semibold text-zinc-700 focus:outline-none focus:border-[#A68942]"
            >
              <option value="all">All Workspace Views</option>
              <option value="dashboard">Dashboard</option>
              <option value="timetable">Timetable & Attendance</option>
              <option value="ai-tutor">AI Tutor Hub</option>
              <option value="study-planner">AI Study Planner</option>
              <option value="quiz-generator">Quiz Generator</option>
              <option value="flashcards">Flashcards (Anki)</option>
              <option value="pdf-brain">Inbuilt File Library</option>
              <option value="calendar">Revision Planner</option>
              <option value="writing-assistant">Writing Assistant</option>
              <option value="analytics">Progress & XP</option>
            </select>
          </div>
        </div>

        {/* Real-Time Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 space-y-2">
              <RefreshCw className="w-6 h-6 text-[#A68942] animate-spin mx-auto" />
              <p className="text-xs text-zinc-500 font-mono">Listening to live Firestore presence updates...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 space-y-2 bg-[#F6F4F0] rounded-2xl border border-[#EAE7E0]">
              <Users className="w-8 h-8 text-zinc-400 mx-auto" />
              <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">No Active Users Found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No users currently match your search parameters or have updated their online presence recently.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE7E0] text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">User Profile & Account</th>
                  <th className="py-3 px-4 font-semibold">Active Workspace View</th>
                  <th className="py-3 px-4 font-semibold">Connection Status</th>
                  <th className="py-3 px-4 font-semibold">Last Heartbeat</th>
                  <th className="py-3 px-4 font-semibold text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE7E0] text-xs">
                {filteredUsers.map((u) => {
                  const badge = getViewBadge(u.currentView);
                  const isWhitelisted = allowedEmails.map(e => e.toLowerCase()).includes((u.email || '').toLowerCase());

                  return (
                    <tr key={u.id || u.uid} className="hover:bg-[#F6F4F0]/60 transition-colors">
                      
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={u.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                              alt={u.displayName}
                              className="w-9 h-9 rounded-xl object-cover border border-[#EAE7E0]"
                            />
                            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#1A1A1A] truncate">{u.displayName || 'Student User'}</span>
                              {isWhitelisted && (
                                <span title="Whitelisted Account">
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#A68942] shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="block font-mono text-[11px] text-zinc-500 truncate">{u.email || 'No email provided'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Current Workspace View */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${badge.color}`}>
                          <Monitor className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Connection Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-bold text-emerald-800 text-[11px]">Online</span>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                        {formatLastSeen(u.lastSeen)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isWhitelisted && (
                            <button
                              onClick={() => {
                                if (u.email) {
                                  addAllowedEmail(u.email);
                                  setAllowedEmails(getAllowedEmails());
                                  showToast(`Whitelisted ${u.email}`);
                                }
                              }}
                              className="px-2.5 py-1 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] hover:bg-[#333333] text-[10px] font-bold flex items-center gap-1"
                              title="Add to Whitelist"
                            >
                              <UserCheck className="w-3 h-3 text-[#A68942]" />
                              <span>Whitelist</span>
                            </button>
                          )}

                          {setActiveView && (
                            <button
                              onClick={() => setActiveView(u.currentView || 'dashboard')}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-[#A68942] hover:bg-[#EAE7E0] transition-colors"
                              title={`Jump to ${badge.label} view`}
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Access Requests & Whitelist Quick Admin Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box 1: Whitelist Quick Add */}
        <div className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EAE7E0] pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#A68942]" />
              <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                Quick Add Email Whitelist
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">{allowedEmails.length} allowed</span>
          </div>

          <form onSubmit={handleAddEmail} className="flex gap-2">
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. student@university.edu"
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] font-bold text-xs hover:bg-[#333333] transition-all"
            >
              Add Email
            </button>
          </form>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {allowedEmails.map((email) => (
              <div key={email} className="px-3 py-1.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] flex items-center justify-between text-xs font-mono">
                <span className="truncate text-zinc-700">{email}</span>
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="text-zinc-400 hover:text-rose-600 p-1"
                  title="Remove from whitelist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Pending Requests Quick Action */}
        <div className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EAE7E0] pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#A68942]" />
              <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                Access Approval Requests
              </h3>
            </div>
            <span className="text-[11px] font-mono text-amber-700 font-bold">{pendingRequestsCount} pending</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {accessRequests.length === 0 ? (
              <p className="text-center py-6 text-zinc-400 text-xs font-mono">No access requests submitted.</p>
            ) : (
              accessRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#1A1A1A] block">{req.name || 'User'}</span>
                      <span className="font-mono text-[11px] text-zinc-500">{req.email}</span>
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
                        className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold text-[10px] hover:bg-rose-200"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="px-2.5 py-1 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] font-bold text-[10px] hover:bg-[#333333] flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Approve</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
