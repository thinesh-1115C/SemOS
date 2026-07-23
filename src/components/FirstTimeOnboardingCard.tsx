import React from 'react';
import { Sparkles, Calendar, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';

interface FirstTimeOnboardingCardProps {
  userName: string;
  authUid?: string | null;
  onOpenAddSubject: () => void;
  onOpenTimetable: () => void;
}

export const FirstTimeOnboardingCard: React.FC<FirstTimeOnboardingCardProps> = ({
  userName,
  authUid,
  onOpenAddSubject,
  onOpenTimetable,
}) => {
  return (
    <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] text-[#FBFBF9] shadow-xl space-y-6 relative overflow-hidden border border-[#A68942]/30">
      
      {/* Background Accent Mesh */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#A68942]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-[#A68942]/20 border border-[#A68942]/40 text-[#A68942]">
            <Sparkles className="w-5 h-5" />
          </span>
          <span className="text-xs font-mono font-bold tracking-wider text-[#A68942] uppercase">
            Welcome to SEMOS Student Hub
          </span>
        </div>

        {authUid ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Isolated Multi-Tenant Session</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            <span>Guest Workspace</span>
          </div>
        )}
      </div>

      {/* Headline */}
      <div className="space-y-2 max-w-2xl">
        <h2 className="font-serif font-bold text-2xl md:text-3xl text-white">
          Hello, {userName || 'Scholar'}! Let's set up your semester.
        </h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Your workspace is empty and ready for your current academic term. Configure your enrolled subjects and class timetable to activate AI tutoring, attendance tracking, and spaced repetition revision scheduling.
        </p>
      </div>

      {/* Quick Action Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div 
          onClick={onOpenAddSubject}
          className="p-4 rounded-2xl bg-[#262626] border border-zinc-700 hover:border-[#A68942] transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#A68942]/20 text-[#A68942] flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-white group-hover:text-[#A68942] transition-colors flex items-center gap-1">
              <span>1. Add First Subject</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Enter subject name, code, instructor, and syllabus topics.
            </p>
          </div>
        </div>

        <div 
          onClick={onOpenTimetable}
          className="p-4 rounded-2xl bg-[#262626] border border-zinc-700 hover:border-[#A68942] transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#A68942]/20 text-[#A68942] flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-white group-hover:text-[#A68942] transition-colors flex items-center gap-1">
              <span>2. Build Class Timetable</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Schedule weekly lectures & lab slots for automated attendance calculations.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
