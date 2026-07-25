import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Check, LogOut, Sparkles, ShieldCheck, Edit3, Image } from 'lucide-react';
import { UserProfile } from '../types';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, logOut } from '../lib/firebase';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  authUid?: string | null;
  authEmail?: string | null;
  onAuthSuccess?: (user: any) => void;
  onUnauthorizedAttempt?: (email: string) => void;
  onOpenAdmin?: () => void;
  requiredMessage?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  authUid,
  authEmail,
  onAuthSuccess,
  onUnauthorizedAttempt,
  onOpenAdmin,
  requiredMessage,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'profile'>(authUid ? 'profile' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || PRESET_AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Profile fields
  const [major, setMajor] = useState(user.major || 'Computer Science & Engineering');
  const [semester, setSemester] = useState(user.semester || 'Semester 3');
  const [targetGpa, setTargetGpa] = useState(user.targetGpa || 9.0);

  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setAvatar(user.avatar || PRESET_AVATARS[0]);
      setMajor(user.major || 'Computer Science & Engineering');
      setSemester(user.semester || 'Semester 3');
      setTargetGpa(user.targetGpa || 9.0);
      if (authUid) {
        setTab('profile');
      }
    }
  }, [isOpen, user, authUid]);

  if (!isOpen) return null;

  const handleSignInEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fbUser = await signInWithEmail(email, password);
      if (onAuthSuccess) onAuthSuccess(fbUser);
      onClose();
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err?.message || 'Failed to sign in. Please check email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fbUser = await signUpWithEmail(email, password, name);
      if (onAuthSuccess) onAuthSuccess(fbUser);
      onClose();
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const fbUser = await signInWithGoogle();
      if (onAuthSuccess) onAuthSuccess(fbUser);
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err?.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveProfile = () => {
    onUpdateUser({
      name: name.trim() || user.name || 'Student',
      email: authEmail || email || user.email,
      avatar: avatar || user.avatar,
      major,
      semester,
      targetGpa: Number(targetGpa),
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FBFBF9] border border-[#EAE7E0] rounded-3xl p-6 shadow-2xl text-[#1A1A1A] space-y-5 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE7E0] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#A68942]" />
            <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
              {authUid ? 'Firebase Account & Profile' : 'Student Profile & Authentication'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F6F4F0] text-zinc-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Callout if route protection required sign in */}
        {requiredMessage && !authUid && (
          <div className="p-3 rounded-2xl bg-[#F6F4F0] border border-[#A68942]/40 text-xs text-[#1A1A1A] flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-[#A68942] shrink-0" />
            <span>{requiredMessage}</span>
          </div>
        )}

        {/* Auth Tabs */}
        {!authUid ? (
          <div className="flex border-b border-[#EAE7E0] text-xs">
            <button
              onClick={() => setTab('signin')}
              className={`flex-1 py-2 font-bold border-b-2 transition-colors ${
                tab === 'signin'
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2 font-bold border-b-2 transition-colors ${
                tab === 'signup'
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => setTab('profile')}
              className={`flex-1 py-2 font-bold border-b-2 transition-colors flex items-center justify-center gap-1 ${
                tab === 'profile'
                  ? 'border-[#A68942] text-[#A68942]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Profile</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1A1A1A]">{user.name || 'Authenticated Student'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Firebase Active
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono truncate">{authEmail || user.email}</p>
            <p className="text-[10px] text-zinc-400 font-mono truncate">UID: {authUid}</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        {!authUid && tab === 'signin' && (
          <form onSubmit={handleSignInEmail} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold transition-all shadow-md"
              id="firebase-sign-in-btn"
            >
              {loading ? 'Authenticating...' : 'Sign In with Email'}
            </button>

            <div className="relative py-2 text-center text-zinc-400 text-[10px] uppercase font-mono">
              <span className="bg-[#FBFBF9] px-2 relative z-10">or continue with</span>
              <div className="absolute inset-0 top-1/2 border-t border-[#EAE7E0] -z-0" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 rounded-2xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-[#1A1A1A] font-bold transition-all flex items-center justify-center gap-2"
              id="firebase-google-sign-in-btn"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign In with Google</span>
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {!authUid && tab === 'signup' && (
          <form onSubmit={handleSignUpEmail} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold transition-all shadow-md"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Profile Settings (When Authenticated or Viewing Edit Profile Tab) */}
        {(authUid || tab === 'profile') && (
          <div className="space-y-4 text-xs">
            
            {/* Full Name Field */}
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Full Name / Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#A68942] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-bold text-sm focus:outline-none focus:border-[#A68942]"
                />
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Profile Avatar
              </label>
              <div className="flex items-center gap-2 mb-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatar(url)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                      avatar === url ? 'border-[#A68942] ring-2 ring-[#A68942]/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="relative">
                <Image className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Or paste custom Avatar Image URL"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-zinc-600 text-[11px] focus:outline-none focus:border-[#A68942]"
                />
              </div>
            </div>

            {/* Degree / Major */}
            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Academic Degree / Major</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-semibold"
              />
            </div>

            {/* Semester */}
            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Current Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-semibold"
              >
                {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Save Profile Button */}
            <button
              type="button"
              onClick={handleSaveProfile}
              className="w-full py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Profile & Name Updated!</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>

            {authUid && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Firebase</span>
              </button>
            )}
          </div>
        )}

        {/* Admin Whitelist Manager Trigger */}
        {onOpenAdmin && (
          <div className="pt-2 border-t border-[#EAE7E0] flex items-center justify-between text-xs">
            <span className="text-zinc-500 text-[11px]">Admin or Invite Settings?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="text-[#A68942] font-bold hover:underline flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorization Guard</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

