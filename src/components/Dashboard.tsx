import React, { useState } from 'react';
import { FirstTimeOnboardingCard } from './FirstTimeOnboardingCard';
import { 
  UserProfile, Subject, NoteItem, Flashcard, Quiz, CalendarEvent, 
  StudyAnalyticsData 
} from '../types';
import { 
  Sparkles, Flame, Trophy, Clock, CheckCircle2, AlertTriangle, 
  ArrowRight, Plus, Bot, FileUp, Layers, HelpCircle, FileText, 
  Calendar as CalendarIcon, CalendarCheck, BookOpen, Sigma, Zap, Code, Cpu, Trash2, RefreshCw
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  subjects: Subject[];
  notes: NoteItem[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  events: CalendarEvent[];
  analytics: StudyAnalyticsData;
  authUid?: string | null;
  setActiveView: (view: string) => void;
  setActiveSubjectId: (id: string | null) => void;
  onOpenAddSubject: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  subjects,
  notes,
  flashcards,
  quizzes,
  events,
  analytics,
  authUid,
  setActiveView,
  setActiveSubjectId,
  onOpenAddSubject,
}) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const dueFlashcards = flashcards.filter(f => new Date(f.nextReviewDate) <= new Date());
  const upcomingExams = events.filter(e => e.type === 'exam' && !e.completed);

  const totalStudyHoursThisWeek = analytics.dailyHours.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1);

  const fetchDailySummary = async () => {
    setLoadingSummary(true);
    try {
      const allWeakAreas = subjects.flatMap(s => s.weakAreas);
      const res = await fetch('/api/ai/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects,
          streak: user.streakDays,
          studyHours: totalStudyHoursThisWeek,
          weakAreas: allWeakAreas,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch AI summary:', err);
      setAiSummary('Welcome back! Today\'s focus: Review Vector Calculus Green\'s theorem and practice C++ AVL tree rotations.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sigma': return Sigma;
      case 'Zap': return Zap;
      case 'Code': return Code;
      case 'Cpu': return Cpu;
      default: return BookOpen;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#1A1A1A]">
      
      {/* Hero Welcome & Quick Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#F6F4F0] p-6 rounded-3xl border border-[#EAE7E0] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-[#FBFBF9]">
              {user.semester} • {user.major}
            </span>
            <span className="text-xs text-zinc-500 font-mono">Target GPA: {user.targetGpa}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Welcome back, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-zinc-600 text-xs sm:text-sm mt-1">
            Your academic operating system is online. Here is today's learning report.
          </p>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] flex items-center gap-3 shadow-xs">
            <div className="p-2.5 rounded-xl bg-[#F6F4F0] text-[#A68942]">
              <Flame className="w-5 h-5 text-[#A68942]" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Study Streak</p>
              <p className="text-lg font-serif font-bold text-[#1A1A1A]">{user.streakDays} Days</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] flex items-center gap-3 shadow-xs">
            <div className="p-2.5 rounded-xl bg-[#F6F4F0] text-[#1A1A1A]">
              <Clock className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Hours This Week</p>
              <p className="text-lg font-serif font-bold text-[#1A1A1A]">{totalStudyHoursThisWeek} hrs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Launcher Bar */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 font-mono">
          Quick Workflows
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveView('timetable')}
            className="p-3.5 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] border border-[#1A1A1A] text-left transition-all group shadow-sm text-[#FBFBF9]"
            id="quick-action-timetable"
          >
            <CalendarCheck className="w-5 h-5 text-[#A68942] mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-serif font-bold text-xs text-[#FBFBF9]">Attendance Check-In</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">1-tap daily log</p>
          </button>

          <button
            onClick={() => setActiveView('ai-tutor')}
            className="p-3.5 rounded-2xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-left transition-all group"
            id="quick-action-ai-tutor"
          >
            <Bot className="w-5 h-5 text-[#A68942] mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-serif font-bold text-xs text-[#1A1A1A]">Ask AI Tutor</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Feynman & Exam mode</p>
          </button>

          <button
            onClick={() => setActiveView('study-planner')}
            className="p-3.5 rounded-2xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-left transition-all group"
            id="quick-action-study-planner"
          >
            <Sparkles className="w-5 h-5 text-[#A68942] mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-serif font-bold text-xs text-[#1A1A1A]">AI Study Planner</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">PDF/PPT timeline</p>
          </button>

          <button
            onClick={() => setActiveView('pdf-brain')}
            className="p-3.5 rounded-2xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-left transition-all group"
            id="quick-action-file-library"
          >
            <FileUp className="w-5 h-5 text-[#A68942] mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-serif font-bold text-xs text-[#1A1A1A]">Inbuilt File Library</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Manage & attach files</p>
          </button>

          <button
            onClick={() => setActiveView('pdf-brain')}
            className="p-3.5 rounded-2xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-left transition-all group"
            id="quick-action-upload-pdf"
          >
            <FileUp className="w-5 h-5 text-zinc-700 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-serif font-bold text-xs text-[#1A1A1A]">Upload PDF</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Extract text & QA</p>
          </button>

          <button
            onClick={() => setActiveView('flashcards')}
            className="p-3.5 rounded-2xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-left transition-all group"
            id="quick-action-review-flashcards"
          >
            <div className="flex items-center justify-between">
              <Layers className="w-5 h-5 text-[#A68942] mb-2 group-hover:scale-110 transition-transform" />
              {dueFlashcards.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#A68942] text-white text-[10px] font-bold">
                  {dueFlashcards.length}
                </span>
              )}
            </div>
            <p className="font-serif font-bold text-xs text-[#1A1A1A]">Flashcards</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Spaced repetition</p>
          </button>

          <button
            onClick={() => setActiveView('quiz-generator')}
            className="p-3.5 rounded-2xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-left transition-all group"
            id="quick-action-quick-quiz"
          >
            <HelpCircle className="w-5 h-5 text-zinc-700 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-serif font-bold text-xs text-[#1A1A1A]">Quick Quiz</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Test mastery</p>
          </button>
        </div>
      </div>

      {/* Main Grid: AI Summary + Subjects + Exam Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols wide): AI Recommendation & Subjects */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Daily Summary Card */}
          <div className="p-6 rounded-3xl bg-[#F6F4F0] border border-[#EAE7E0] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#1A1A1A] text-[#A68942]">
                  <Sparkles className="w-4 h-4 text-[#A68942]" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-base text-[#1A1A1A]">AI Daily Recommendation</h2>
                  <p className="text-[11px] text-zinc-500">Personalized learning insights based on weak areas</p>
                </div>
              </div>
              <button
                onClick={fetchDailySummary}
                disabled={loadingSummary}
                className="px-3.5 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                id="generate-daily-summary-btn"
              >
                {loadingSummary ? 'Analyzing...' : 'Generate Fresh Summary'}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] text-xs text-[#1A1A1A] leading-relaxed space-y-2">
              {aiSummary ? (
                <div className="whitespace-pre-line">{aiSummary}</div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[#1A1A1A] font-semibold">🎯 Today's Recommended Study Plan:</p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                    <li>Review <strong className="text-[#A68942]">Vector Calculus Green's Theorem</strong> (Math III exam in 14 days).</li>
                    <li>Practice 10 flashcards on <strong className="text-[#1A1A1A]">BJT Voltage Divider Biasing</strong>.</li>
                    <li>Explain <strong className="text-[#A68942]">AVL Tree Rotation Logic</strong> to AI Tutor in Feynman Mode.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Academic Overview: Enrolled Subject Workspaces */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1A1A1A]">Enrolled Subjects</h2>
                <p className="text-xs text-zinc-500">Workspaces for notes, PDFs, flashcards & AI tutors</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddSubject}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-semibold text-xs transition-colors shadow-xs"
                  id="add-subject-dashboard-btn"
                >
                  <Plus className="w-3.5 h-3.5 text-[#A68942]" />
                  <span>Add Subject</span>
                </button>
              </div>
            </div>

            {subjects.length === 0 ? (
              <FirstTimeOnboardingCard
                userName={user.name}
                authUid={authUid}
                onOpenAddSubject={onOpenAddSubject}
                onOpenTimetable={() => setActiveView('timetable')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((subject) => {
                const SubjectIcon = getSubjectIcon(subject.icon);
                return (
                  <div
                    key={subject.id}
                    onClick={() => {
                      setActiveSubjectId(subject.id);
                      setActiveView('subject');
                    }}
                    className="p-5 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] hover:border-[#A68942]/60 cursor-pointer transition-all hover:-translate-y-0.5 group shadow-xs"
                    id={`subject-card-${subject.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] flex items-center justify-center shadow-xs">
                          <SubjectIcon className="w-5 h-5 text-[#A68942]" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-[#A68942] font-semibold">{subject.code}</span>
                          <h3 className="font-serif font-bold text-sm text-[#1A1A1A] group-hover:text-[#A68942] transition-colors line-clamp-1">
                            {(subject?.name || '').split('(')[0]?.trim() || subject?.code || 'Subject'}
                          </h3>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#A68942] transition-colors" />
                    </div>

                    {/* Attendance & Mastery progress */}
                    <div className="space-y-2 mt-4 pt-3 border-t border-[#EAE7E0]">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Attendance</span>
                        <span className="font-semibold text-emerald-700">{subject.attendancePercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#EAE7E0] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${subject.attendancePercent}%` }} />
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Subject Mastery</span>
                        <span className="font-semibold text-[#A68942]">{subject.masteryPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#EAE7E0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#A68942] rounded-full" style={{ width: `${subject.masteryPercent}%` }} />
                      </div>
                    </div>

                    {/* Weak Areas pill */}
                    {subject.weakAreas.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#EAE7E0] flex items-center gap-1.5 text-[10px] text-[#A68942]">
                        <AlertTriangle className="w-3 h-3 text-[#A68942] shrink-0" />
                        <span className="truncate">Weak area: {subject.weakAreas[0]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div>

        {/* Right Column: Upcoming Exams & Flashcards Due & Recent Notes */}
        <div className="space-y-6">
          
          {/* Upcoming Exams Widget */}
          <div className="p-5 rounded-3xl bg-[#F6F4F0] border border-[#EAE7E0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#A68942]" />
                <span>Upcoming Exams</span>
              </h3>
              <button 
                onClick={() => setActiveView('calendar')}
                className="text-[11px] font-semibold text-[#A68942] hover:underline"
              >
                View Calendar
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingExams.length > 0 ? (
                upcomingExams.map((ex) => {
                  const subject = subjects.find(s => s.id === ex.subjectId);
                  return (
                    <div key={ex.id} className="p-3 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-[#1A1A1A]">{ex.title}</p>
                        <p className="text-[10px] text-[#A68942] font-semibold">{subject?.name.split('(')[0] || 'Subject Exam'}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#FBFBF9] font-mono text-[10px]">
                          {ex.date}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-500 italic">No exams scheduled in next 30 days.</p>
              )}
            </div>
          </div>

          {/* Flashcard Spaced Repetition Due Widget */}
          <div className="p-5 rounded-3xl bg-[#F6F4F0] border border-[#EAE7E0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#A68942]" />
                <span>Revision Reminders</span>
              </h3>
              <button 
                onClick={() => setActiveView('flashcards')}
                className="text-[11px] font-semibold text-[#A68942] hover:underline"
              >
                Study Flashcards
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] text-xs space-y-2">
              <p className="font-bold text-[#A68942]">
                {dueFlashcards.length} cards scheduled for review today
              </p>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Reviewing cards right when the forgetting curve triggers increases retention by 300%.
              </p>
              <button
                onClick={() => setActiveView('flashcards')}
                className="w-full mt-2 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-semibold text-xs transition-colors shadow-sm"
              >
                Start 5-Min Spaced Practice
              </button>
            </div>
          </div>

          {/* Recent Notes */}
          <div className="p-5 rounded-3xl bg-[#F6F4F0] border border-[#EAE7E0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#A68942]" />
                <span>Recent Subject Notes</span>
              </h3>
            </div>

            <div className="space-y-2">
              {notes.slice(0, 3).map((note) => (
                <div 
                  key={note.id}
                  onClick={() => {
                    setActiveSubjectId(note.subjectId);
                    setActiveView('subject');
                  }}
                  className="p-3 rounded-xl bg-[#FBFBF9] hover:bg-[#EAE7E0]/60 border border-[#EAE7E0] cursor-pointer transition-colors"
                >
                  <p className="font-semibold text-xs text-[#1A1A1A] line-clamp-1">{note.title}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Updated {note.updatedAt}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
