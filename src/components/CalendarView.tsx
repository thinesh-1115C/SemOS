import React, { useState } from 'react';
import { Subject, CalendarEvent } from '../types';
import { 
  Calendar as CalendarIcon, Clock, CheckCircle2, Plus, 
  Sparkles, BookOpen, AlertCircle, ArrowRight
} from 'lucide-react';

interface CalendarViewProps {
  subjects: Subject[];
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id' | 'completed'>) => void;
  onToggleEventComplete: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  subjects,
  events,
  onAddEvent,
  onToggleEventComplete,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:30 AM');
  const [type, setType] = useState<CalendarEvent['type']>('revision');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || 'custom');
  const [customSubjectCode, setCustomSubjectCode] = useState('');
  const [customSubjectName, setCustomSubjectName] = useState('');

  const [aiSchedule, setAiSchedule] = useState<string | null>(null);

  const handleCreateEvent = () => {
    if (!title.trim()) return;
    onAddEvent({
      subjectId: selectedSubjectId !== 'custom' ? selectedSubjectId : undefined,
      customSubjectCode: selectedSubjectId === 'custom' ? customSubjectCode || 'GEN101' : undefined,
      customSubjectName: selectedSubjectId === 'custom' ? customSubjectName || 'General Subject' : undefined,
      title,
      date,
      startTime,
      endTime,
      type,
    });
    setTitle('');
    setShowAddForm(false);
  };

  const generateForgettingCurveSchedule = () => {
    setAiSchedule(`📅 Automated Forgetting Curve Revision Schedule Generated:

• Day 1 (Today): Initial Topic Review & Flashcards
• Day 2 (Tomorrow): Active Recall & Practice Problems
• Day 5: Spaced Review & Self-Quiz
• Day 10: Final Comprehensive Mastery Check`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Forgetting Curve Revision Planner</h1>
            <p className="text-xs text-slate-400">Automated reviews scheduled at Day 1, 2, 5, 10 & 30 for long-term memory retention</p>
          </div>
        </div>

        <button
          onClick={generateForgettingCurveSchedule}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Optimize Schedule with AI</span>
        </button>
      </div>

      {aiSchedule && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-200 leading-relaxed font-mono whitespace-pre-line shadow-lg">
          {aiSchedule}
        </div>
      )}

      {/* Add Event Form */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-white">Academic Calendar & Upcoming Events</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event / Exam</span>
          </button>
        </div>

        {showAddForm && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Physics Midterm Exam"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Event Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="lab">Lab Report</option>
                  <option value="revision">Forgetting Curve Revision</option>
                  <option value="study_session">Study Session</option>
                </select>
              </div>
            </div>

            {/* Custom Timeslot Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Start Time</label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">End Time</label>
                <input
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Select / Type Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                  <option value="custom">+ Type Custom Subject & Code</option>
                </select>
              </div>
            </div>

            {selectedSubjectId === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ECE401, MATH301"
                    value={customSubjectCode}
                    onChange={(e) => setCustomSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Embedded Systems Architecture"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddForm(false)} className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 font-semibold hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={handleCreateEvent} className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md">
                Save Event
              </button>
            </div>
          </div>
        )}

        {/* Events Timeline List */}
        <div className="space-y-2 pt-2">
          {events.map((ev) => {
            const subject = subjects.find(s => s.id === ev.subjectId);
            const displayCode = subject?.code || ev.customSubjectCode || 'GEN101';
            const displayName = subject?.name || ev.customSubjectName || '';

            return (
              <div
                key={ev.id}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  ev.completed
                    ? 'bg-slate-950/50 border-slate-800/60 opacity-60'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleEventComplete(ev.id)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      ev.completed ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 fill-current" />
                  </button>
                  <div>
                    <p className={`font-bold text-xs ${ev.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                      {ev.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">{displayCode}</span>
                      {displayName && <span className="text-[10px] text-slate-400 truncate max-w-[150px]">• {displayName}</span>}
                      {(ev.startTime || ev.endTime) && (
                        <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>{ev.startTime || '09:00 AM'}{ev.endTime ? ` - ${ev.endTime}` : ''}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                    ev.type === 'exam' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    ev.type === 'assignment' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {ev.type}
                  </span>
                  <span className="font-mono text-slate-400 font-semibold">{ev.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
