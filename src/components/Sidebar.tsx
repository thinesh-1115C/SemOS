import React from 'react';
import { 
  LayoutDashboard, BookOpen, Bot, Layers, HelpCircle, 
  FileText, Calendar, CalendarCheck, PenTool, BarChart3, Plus, Sparkles,
  Zap, Compass
} from 'lucide-react';
import { Subject } from '../types';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  subjects: Subject[];
  activeSubjectId: string | null;
  setActiveSubjectId: (id: string | null) => void;
  onAddSubjectClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  subjects,
  activeSubjectId,
  setActiveSubjectId,
  onAddSubjectClick,
}) => {

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timetable', label: 'Timetable & Attendance', icon: CalendarCheck, badge: 'Daily' },
    { id: 'ai-tutor', label: 'AI Tutor Hub', icon: Bot, badge: 'Smarter' },
    { id: 'study-planner', label: 'AI Study Planner', icon: Compass, badge: 'Auto' },
    { id: 'cgpa-calculator', label: 'CGPA Tracker', icon: Zap, badge: '10.0' },
    { id: 'flashcards', label: 'Flashcards (Anki)', icon: Layers },
    { id: 'quiz-generator', label: 'Quiz Generator', icon: HelpCircle },
    { id: 'pdf-brain', label: 'PDF Library & QA', icon: FileText },
    { id: 'calendar', label: 'Revision Planner', icon: Calendar },
    { id: 'writing-assistant', label: 'Writing Assistant', icon: PenTool },
    { id: 'analytics', label: 'Progress & XP', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-[#F6F4F0] border-r border-[#EAE7E0] text-[#1A1A1A] flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        
        {/* Navigation Core Section */}
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-2 font-mono">
            Academic OS
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setActiveSubjectId(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-[#1A1A1A] text-[#FBFBF9] shadow-sm font-semibold' 
                      : 'text-zinc-600 hover:text-[#1A1A1A] hover:bg-[#EAE7E0]/60'
                  }`}
                  id={`nav-item-${item.id}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#A68942]' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      isActive ? 'bg-[#A68942] text-white border-[#A68942]' : 'bg-[#EAE7E0] text-[#A68942] border-[#EAE7E0]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Subjects Workspace Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
              Enrolled Subjects
            </p>
            <button
              onClick={onAddSubjectClick}
              className="p-1 rounded-lg hover:bg-[#EAE7E0] text-zinc-500 hover:text-[#A68942] transition-colors"
              title="Add New Subject"
              id="add-subject-sidebar-btn"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {subjects.map((subject) => {
              const isSelected = activeView === 'subject' && activeSubjectId === subject.id;
              return (
                <button
                  key={subject.id}
                  onClick={() => {
                    setActiveView('subject');
                    setActiveSubjectId(subject.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                    isSelected
                      ? 'bg-[#EAE7E0] text-[#1A1A1A] border border-[#A68942]/40 font-semibold'
                      : 'text-zinc-600 hover:text-[#1A1A1A] hover:bg-[#EAE7E0]/40'
                  }`}
                  id={`sidebar-subject-${subject.id}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${subject.color}`} />
                    <span className="truncate">{(subject?.name || '').split('(')[0]?.trim() || subject?.code || 'Subject'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                    {subject.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer Banner / Memory Indicator */}
      <div className="p-4 border-t border-[#EAE7E0] bg-[#FBFBF9]">
        <div className="p-3 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs">
          <div className="flex items-center gap-2 mb-1 text-[#A68942] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#A68942]" />
            <span>AI Memory Active</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed mb-2">
            SemOS remembers weak areas, preferred learning styles & quiz history.
          </p>
          <button
            onClick={() => setActiveView('ai-tutor')}
            className="w-full text-center py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-semibold text-[11px] transition-colors shadow-sm"
          >
            Ask AI Tutor
          </button>
        </div>
      </div>
    </aside>
  );
};
