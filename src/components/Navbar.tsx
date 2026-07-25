import React, { useState } from 'react';
import { 
  BookOpen, Search, Bell, Sparkles, Flame, Trophy, 
  ChevronDown, User, LogOut, CheckCircle2, Calendar,
  ArrowRight, Trash2, RotateCcw, ShieldCheck
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../types';
import { logOut } from '../lib/firebase';

interface NavbarProps {
  user: UserProfile;
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenEditProfile?: () => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
  authUid?: string | null;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  setActiveView,
  onOpenSearch,
  onOpenAuth,
  onOpenEditProfile,
  notifications,
  onMarkNotificationsRead,
  authUid,
  onOpenAdmin,
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBF9]/95 backdrop-blur-md border-b border-[#EAE7E0] text-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveView(authUid ? 'dashboard' : 'homepage')}
            className="flex items-center gap-2.5 group focus:outline-none"
            id="semos-logo-btn"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] p-0.5 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#A68942]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif font-bold text-xl tracking-tight text-[#1A1A1A]">
                SemOS
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-[#A68942] uppercase -mt-1">
                Academic OS
              </span>
            </div>
          </button>

          {/* Semester Selector Pill (Workspace Only) */}
          {activeView !== 'homepage' && (
            <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1.5 rounded-full bg-[#F6F4F0] border border-[#EAE7E0] text-xs font-medium text-[#1A1A1A]">
              <span className="w-2 h-2 rounded-full bg-[#A68942]" />
              <span>{user.semester}</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-600 max-w-[140px] truncate">{user.major}</span>
            </div>
          )}
        </div>

        {/* Search Bar Trigger (Workspace Only) */}
        {activeView !== 'homepage' && (
          <div className="flex-1 max-w-md hidden sm:block">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#F6F4F0] hover:bg-[#EAE7E0]/60 border border-[#EAE7E0] text-zinc-500 text-sm transition-all group"
              id="global-search-trigger"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-zinc-400 group-hover:text-[#A68942] transition-colors" />
                <span className="text-zinc-500 group-hover:text-[#1A1A1A] transition-colors">
                  Search notes, PDFs, flashcards, AI chats...
                </span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[#EAE7E0] text-zinc-700 rounded border border-zinc-300">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Right Action Icons & User Stats */}
        <div className="flex items-center gap-2.5 sm:gap-3">

          {/* Landing / App Toggle Button */}
          {activeView === 'homepage' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-[#F6F4F0] hover:bg-[#EAE7E0] text-[#1A1A1A] text-xs font-semibold border border-[#EAE7E0] transition-all"
                id="signin-nav-btn"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  if (authUid) {
                    setActiveView('dashboard');
                  } else {
                    onOpenAuth();
                  }
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] text-xs font-semibold shadow-sm transition-all"
                id="launch-app-nav-btn"
              >
                <span>{authUid ? 'Launch Workspace' : 'Get Started'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#A68942]" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setActiveView(authUid ? 'dashboard' : 'homepage')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F6F4F0] hover:bg-[#EAE7E0] text-zinc-700 text-xs font-medium border border-[#EAE7E0] transition-colors"
                id="view-homepage-btn"
              >
                <span>{authUid ? 'Dashboard' : 'Overview'}</span>
              </button>

              {/* Gamification Streak & XP Badge */}
              <div 
                onClick={() => setActiveView('analytics')}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] cursor-pointer transition-colors"
                title="Current Streak & Level XP"
                id="user-streak-badge"
              >
                <div className="flex items-center gap-1 text-[#A68942] text-xs font-bold">
                  <Flame className="w-4 h-4 text-[#A68942]" />
                  <span>{user.streakDays}d</span>
                </div>
                <div className="w-px h-3.5 bg-[#EAE7E0]" />
                <div className="flex items-center gap-1 text-zinc-700 text-xs font-semibold">
                  <Trophy className="w-3.5 h-3.5 text-[#A68942]" />
                  <span>Lvl {user.level}</span>
                </div>
              </div>

              {/* Notifications Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    if (!showNotifDropdown && unreadCount > 0) {
                      onMarkNotificationsRead();
                    }
                  }}
                  className="p-2 rounded-xl bg-[#F6F4F0] hover:bg-[#EAE7E0] text-zinc-700 border border-[#EAE7E0] transition-colors relative"
                  aria-label="Notifications"
                  id="notifications-btn"
                >
                  <Bell className="w-4 h-4 text-zinc-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#A68942] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#FBFBF9] border border-[#EAE7E0] rounded-2xl shadow-xl z-50 p-3 text-xs text-[#1A1A1A]">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EAE7E0]">
                      <span className="font-serif font-bold text-[#1A1A1A]">Notifications & Reminders</span>
                      <span className="text-[11px] text-zinc-500">{notifications.length} total</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {notifications.map((n) => (
                        <div 
                          key={n.id}
                          className={`p-2.5 rounded-xl border transition-colors ${
                            n.read ? 'bg-[#F6F4F0]/50 border-[#EAE7E0] text-zinc-500' : 'bg-[#F6F4F0] border-[#A68942]/40 text-[#1A1A1A]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-semibold text-[#A68942] text-xs">{n.title}</span>
                            <span className="text-[10px] text-zinc-400">{n.time}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-zinc-600">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Avatar / Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F6F4F0] transition-colors focus:outline-none"
                  id="user-profile-menu-btn"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#A68942]/40"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 hidden sm:block" />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#FBFBF9] border border-[#EAE7E0] rounded-2xl shadow-xl z-50 p-3 text-xs text-[#1A1A1A]">
                    <div className="flex items-center gap-3 pb-3 mb-2 border-b border-[#EAE7E0]">
                      <img src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} alt={user.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#A68942]" />
                      <div className="overflow-hidden">
                        <p className="font-bold text-[#1A1A1A] truncate">{user.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                        <span className="inline-block px-1.5 py-0.5 mt-1 rounded bg-[#F6F4F0] text-[#A68942] font-semibold text-[10px] border border-[#EAE7E0]">
                          {user.semester} • {user.targetGpa}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          if (onOpenEditProfile) {
                            onOpenEditProfile();
                          } else {
                            onOpenAuth();
                          }
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F6F4F0] text-zinc-700 text-xs transition-colors text-left"
                        id="edit-profile-nav-item"
                      >
                        <User className="w-3.5 h-3.5 text-[#A68942]" />
                        <span>Edit Profile & Preferences</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveView('analytics');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F6F4F0] text-zinc-700 text-xs transition-colors text-left"
                      >
                        <Trophy className="w-3.5 h-3.5 text-[#A68942]" />
                        <span>Academic Stats & Badges</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveView('admin');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#F6F4F0] text-[#A68942] font-bold text-xs transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#A68942]" />
                          <span>Admin Dashboard & Presence</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">LIVE</span>
                      </button>

                      {onOpenAdmin && (
                        <button
                          onClick={() => {
                            onOpenAdmin();
                            setShowProfileDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F6F4F0] text-zinc-700 text-xs transition-colors text-left"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Quick Whitelist Popup</span>
                        </button>
                      )}
                      <div className="my-1 border-t border-[#EAE7E0]" />
                      <button
                        onClick={async () => {
                          setShowProfileDropdown(false);
                          await logOut();
                          setActiveView('homepage');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors text-left"
                        id="signout-nav-item"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}</div>

      </div>
    </header>
  );
};
