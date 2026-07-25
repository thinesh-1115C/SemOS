import React, { useState, useEffect } from 'react';
import { X, User, Sparkles, Check, BookOpen, GraduationCap, Camera, Save, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveProfile: (updatedData: { displayName: string; major?: string; semester?: string; targetGpa?: number; avatar?: string }) => Promise<void> | void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250"
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveProfile
}) => {
  const [displayName, setDisplayName] = useState(user.name || '');
  const [major, setMajor] = useState(user.major || 'Computer Science');
  const [semester, setSemester] = useState(user.semester || 'Semester 1');
  const [targetGpa, setTargetGpa] = useState<number>(user.targetGpa || 4.0);
  const [avatar, setAvatar] = useState(user.avatar || AVATAR_PRESETS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.name || '');
      setMajor(user.major || 'Computer Science');
      setSemester(user.semester || 'Semester 1');
      setTargetGpa(user.targetGpa || 4.0);
      setAvatar(user.avatar || AVATAR_PRESETS[0]);
      setErrorMessage(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onSaveProfile({
        displayName: displayName.trim(),
        major: major.trim(),
        semester: semester.trim(),
        targetGpa: Number(targetGpa),
        avatar
      });
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err?.message || 'Failed to save changes. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-[#FBFBF9] border border-[#EAE7E0] rounded-3xl shadow-2xl overflow-hidden text-[#1A1A1A] animate-scale-up"
        id="edit-profile-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EAE7E0] bg-[#F6F4F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] text-[#FBFBF9] flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-[#A68942]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">Edit Profile & Preferences</h2>
              <p className="text-xs text-zinc-500">Update your account display name & academic settings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-[#1A1A1A] hover:bg-[#EAE7E0] transition-colors"
            id="close-edit-profile-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Avatar Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 font-mono">
              Profile Avatar
            </label>
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="Selected Avatar"
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#A68942] shadow-sm shrink-0"
              />
              <div className="flex flex-wrap items-center gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all ${
                      avatar === preset ? 'border-[#A68942] scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 font-mono">
              Display Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-sm text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942] transition-colors"
                id="edit-profile-display-name-input"
              />
            </div>
          </div>

          {/* Major / Field of Study */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 font-mono">
                Major / Degree
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-sm text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 font-mono">
                Current Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-sm text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942] transition-colors"
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Semester 3">Semester 3</option>
                <option value="Semester 4">Semester 4</option>
                <option value="Semester 5">Semester 5</option>
                <option value="Semester 6">Semester 6</option>
                <option value="Semester 7">Semester 7</option>
                <option value="Semester 8">Semester 8</option>
              </select>
            </div>
          </div>

          {/* Target GPA */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 font-mono">
              Target Scale (0.00 - 4.00)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="4.0"
              value={targetGpa}
              onChange={(e) => setTargetGpa(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-sm text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942] transition-colors"
            />
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE7E0]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-[#EAE7E0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-[#1A1A1A] text-[#FBFBF9] hover:bg-[#333333] font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              id="save-edit-profile-btn"
            >
              {isSaving ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#A68942] animate-spin" />
                  <span>Saving to Firestore...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#A68942]" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
