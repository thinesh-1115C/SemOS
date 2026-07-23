import React, { useState } from 'react';
import { 
  Subject, TimetableSlot, AttendanceLog, DayOfWeek, AttendanceStatus 
} from '../types';
import { 
  Calendar, CheckCircle2, XCircle, MinusCircle, Plus, 
  Clock, MapPin, User, BarChart2, AlertTriangle, Sparkles, 
  Trash2, Edit3, CheckCheck, XSquare, ShieldCheck, Calculator, ArrowRight, Filter
} from 'lucide-react';

interface TimetableAttendanceViewProps {
  subjects: Subject[];
  timetableSlots: TimetableSlot[];
  attendanceLogs: AttendanceLog[];
  onAddTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  onDeleteTimetableSlot: (slotId: string) => void;
  onLogAttendance: (log: Omit<AttendanceLog, 'id' | 'timestamp'>) => void;
  onBatchLogAttendance: (date: string, slots: TimetableSlot[], status: AttendanceStatus) => void;
  onManualAdjustAttendance?: (subjectId: string, addAttended: number, addConducted: number) => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TimetableAttendanceView: React.FC<TimetableAttendanceViewProps> = ({
  subjects,
  timetableSlots,
  attendanceLogs,
  onAddTimetableSlot,
  onDeleteTimetableSlot,
  onLogAttendance,
  onBatchLogAttendance,
}) => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'weekly' | 'stats'>('checkin');

  // Selected Date for Daily Check-In
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [attendanceTarget, setAttendanceTarget] = useState<number>(75);

  // Modal State for adding new Timetable Slot
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    subjectId: subjects[0]?.id || '',
    day: 'Monday' as DayOfWeek,
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    room: 'LT-101',
    type: 'Lecture' as 'Lecture' | 'Lab' | 'Tutorial' | 'Seminar',
    instructor: '',
  });

  // Calculate day of week from selectedDate
  const getDayFromDate = (dateStr: string): DayOfWeek => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayIndex = dateObj.getDay(); // 0 is Sun, 1 is Mon...
    const map: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return map[dayIndex];
  };

  const selectedDay = getDayFromDate(selectedDate);

  // Filter slots for current day
  const todaySlots = timetableSlots
    .filter(slot => slot.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Helper to find log for a given date and slotId
  const getLogForSlot = (slotId: string, dateStr: string) => {
    return attendanceLogs.find(log => log.slotId === slotId && log.date === dateStr);
  };

  // Subject-level Attendance Metrics Calculation
  const subjectStats = subjects.map(sub => {
    const subLogs = attendanceLogs.filter(log => log.subjectId === sub.id);
    const totalConducted = subLogs.filter(l => l.status === 'present' || l.status === 'absent').length;
    const totalAttended = subLogs.filter(l => l.status === 'present').length;
    const totalAbsent = subLogs.filter(l => l.status === 'absent').length;
    const totalCancelled = subLogs.filter(l => l.status === 'cancelled').length;

    const percentage = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : sub.attendancePercent;

    // Bunk / Margin Calculation for Target % (e.g. 75%)
    // Let T = target % (e.g. 0.75), A = Attended, C = Conducted
    // If A/C >= T: Can skip x classes -> (A) / (C + x) >= T => x = floor((A - T*C) / T)
    // If A/C < T: Need to attend y classes -> (A + y) / (C + y) >= T => y = ceil((T*C - A) / (1 - T))
    const T = attendanceTarget / 100;
    let BunkMarginText = '';
    let BunkMarginType: 'safe' | 'warning' | 'neutral' = 'neutral';

    if (totalConducted === 0) {
      BunkMarginText = 'No recorded classes yet';
      BunkMarginType = 'neutral';
    } else if (percentage >= attendanceTarget) {
      const maxSkip = Math.floor((totalAttended - T * totalConducted) / T);
      if (maxSkip > 0) {
        BunkMarginText = `Safe to skip ${maxSkip} next ${maxSkip === 1 ? 'class' : 'classes'}`;
        BunkMarginType = 'safe';
      } else {
        BunkMarginText = `On track! Don't miss the next class`;
        BunkMarginType = 'safe';
      }
    } else {
      const needAttend = Math.ceil((T * totalConducted - totalAttended) / (1 - T));
      BunkMarginText = `Must attend next ${needAttend} consecutive ${needAttend === 1 ? 'class' : 'classes'} to reach ${attendanceTarget}%`;
      BunkMarginType = 'warning';
    }

    return {
      subject: sub,
      totalConducted,
      totalAttended,
      totalAbsent,
      totalCancelled,
      percentage,
      BunkMarginText,
      BunkMarginType,
    };
  });

  // Overall Attendance
  const overallConducted = subjectStats.reduce((acc, s) => acc + s.totalConducted, 0);
  const overallAttended = subjectStats.reduce((acc, s) => acc + s.totalAttended, 0);
  const overallPercentage = overallConducted > 0 
    ? Math.round((overallAttended / overallConducted) * 100) 
    : Math.round(subjects.reduce((acc, s) => acc + s.attendancePercent, 0) / (subjects.length || 1));

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.subjectId) return;
    onAddTimetableSlot(newSlot);
    setIsAddModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#1A1A1A]">
      
      {/* Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#F6F4F0] p-6 rounded-3xl border border-[#EAE7E0] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1A1A1A] text-[#A68942] shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
                Timetable & Attendance
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#A68942]/15 text-[#A68942] text-[11px] font-mono font-bold">
                {overallPercentage}% Overall
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-0.5">
              Daily class check-ins, batch logging, 75% attendance recovery calculations & weekly schedule
            </p>
          </div>
        </div>

        {/* Tab Switcher Navigation */}
        <div className="flex bg-[#FBFBF9] p-1 rounded-2xl border border-[#EAE7E0] text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'checkin'
                ? 'bg-[#1A1A1A] text-[#FBFBF9] shadow-xs'
                : 'text-zinc-600 hover:text-[#1A1A1A]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#A68942]" />
            <span>Daily Check-In</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-[#1A1A1A] text-[#FBFBF9] shadow-xs'
                : 'text-zinc-600 hover:text-[#1A1A1A]'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-[#A68942]" />
            <span>Attendance Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'weekly'
                ? 'bg-[#1A1A1A] text-[#FBFBF9] shadow-xs'
                : 'text-zinc-600 hover:text-[#1A1A1A]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#A68942]" />
            <span>Weekly Schedule</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DAILY CHECK-IN UI */}
      {/* ========================================================= */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          
          {/* Controls Bar: Date picker & Batch Action buttons */}
          <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
            
            {/* Date Switcher */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs font-serif font-bold text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                />
              </div>

              <div className="h-8 w-px bg-[#EAE7E0] hidden sm:block" />

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setSelectedDate(today);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedDate === new Date().toISOString().split('T')[0]
                      ? 'bg-[#1A1A1A] text-[#FBFBF9] border-[#1A1A1A]'
                      : 'bg-[#F6F4F0] text-zinc-700 border-[#EAE7E0] hover:bg-[#EAE7E0]'
                  }`}
                >
                  Today
                </button>
                <span className="text-xs font-serif font-bold text-[#A68942] px-2 py-1 rounded-lg bg-[#A68942]/10">
                  {selectedDay}
                </span>
              </div>
            </div>

            {/* Quick Batch Logging Buttons (Present All / Absent All) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onBatchLogAttendance(selectedDate, todaySlots, 'present')}
                disabled={todaySlots.length === 0}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                id="present-all-btn"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Present All ({todaySlots.length})</span>
              </button>

              <button
                onClick={() => onBatchLogAttendance(selectedDate, todaySlots, 'absent')}
                disabled={todaySlots.length === 0}
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                id="absent-all-btn"
              >
                <XSquare className="w-4 h-4" />
                <span>Absent All ({todaySlots.length})</span>
              </button>
            </div>

          </div>

          {/* Today's Scheduled Classes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-serif font-bold text-sm uppercase tracking-wider text-zinc-500">
                Scheduled Classes for {selectedDay} ({todaySlots.length})
              </h2>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs font-bold text-[#A68942] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class Slot</span>
              </button>
            </div>

            {todaySlots.length === 0 ? (
              <div className="p-12 text-center bg-[#FBFBF9] rounded-3xl border border-[#EAE7E0] space-y-3">
                <Calendar className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="font-serif font-bold text-sm text-[#1A1A1A]">No classes scheduled for {selectedDay}</p>
                <p className="text-xs text-zinc-500">You can add class slots using the button above or configure your weekly timetable.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-[#A68942]" />
                  <span>Add Class to {selectedDay}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {todaySlots.map((slot) => {
                  const subject = subjects.find(s => s.id === slot.subjectId);
                  const existingLog = getLogForSlot(slot.id, selectedDate);
                  const currentStatus = existingLog?.status;

                  return (
                    <div
                      key={slot.id}
                      className={`p-5 rounded-3xl border transition-all ${
                        currentStatus === 'present'
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : currentStatus === 'absent'
                          ? 'bg-rose-50/60 border-rose-200'
                          : currentStatus === 'cancelled'
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-[#FBFBF9] border-[#EAE7E0] hover:border-[#A68942]/40'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Class Info */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#1A1A1A] text-[#FBFBF9] text-[10px] font-mono font-bold">
                              {subject?.code || 'SUB'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-[#A68942]/15 text-[#A68942] text-[10px] font-bold">
                              {slot.type}
                            </span>
                            <span className="text-xs font-mono font-bold text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>

                          <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                            {subject?.name || 'Class Subject'}
                          </h3>

                          <div className="flex items-center gap-4 text-xs text-zinc-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                              {slot.room}
                            </span>
                            {slot.instructor && (
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                {slot.instructor}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Present Button */}
                          <button
                            onClick={() => onLogAttendance({
                              date: selectedDate,
                              slotId: slot.id,
                              subjectId: slot.subjectId,
                              status: 'present',
                            })}
                            className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600 ring-offset-2'
                                : 'bg-[#F6F4F0] hover:bg-emerald-100 text-emerald-800 border border-[#EAE7E0]'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Present</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            onClick={() => onLogAttendance({
                              date: selectedDate,
                              slotId: slot.id,
                              subjectId: slot.subjectId,
                              status: 'absent',
                            })}
                            className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-600 ring-offset-2'
                                : 'bg-[#F6F4F0] hover:bg-rose-100 text-rose-800 border border-[#EAE7E0]'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Absent</span>
                          </button>

                          {/* Cancelled / Off Toggle */}
                          <button
                            onClick={() => onLogAttendance({
                              date: selectedDate,
                              slotId: slot.id,
                              subjectId: slot.subjectId,
                              status: 'cancelled',
                            })}
                            title="Class Cancelled / Holiday"
                            className={`p-2.5 rounded-2xl font-bold text-xs transition-all ${
                              currentStatus === 'cancelled'
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'bg-[#F6F4F0] hover:bg-amber-100 text-amber-800 border border-[#EAE7E0]'
                            }`}
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ATTENDANCE STATS & 75% RECOVERY CALCULATOR */}
      {/* ========================================================= */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          
          {/* Top Target Configuration Banner */}
          <div className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#A68942] uppercase tracking-wider">
                Academic Threshold Target
              </span>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Required Minimum Attendance Criteria
              </h2>
              <p className="text-xs text-zinc-500">
                Adjust target percentage to automatically recalculate class safe-bunk allowances or recovery requirements.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {[75, 80, 85].map((target) => (
                <button
                  key={target}
                  onClick={() => setAttendanceTarget(target)}
                  className={`px-4 py-2 rounded-2xl font-bold text-xs border transition-all ${
                    attendanceTarget === target
                      ? 'bg-[#1A1A1A] text-[#FBFBF9] border-[#1A1A1A] shadow-xs'
                      : 'bg-[#F6F4F0] text-zinc-700 border-[#EAE7E0] hover:bg-[#EAE7E0]'
                  }`}
                >
                  {target}% Target
                </button>
              ))}
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-1 shadow-xs">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Overall Attendance</p>
              <p className={`font-serif text-2xl sm:text-3xl font-bold ${overallPercentage >= attendanceTarget ? 'text-emerald-700' : 'text-rose-700'}`}>
                {overallPercentage}%
              </p>
              <p className="text-[11px] text-zinc-500">Across all subjects</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-1 shadow-xs">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Classes Conducted</p>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                {overallConducted}
              </p>
              <p className="text-[11px] text-zinc-500">Recorded sessions</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-1 shadow-xs">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Classes Attended</p>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-700">
                {overallAttended}
              </p>
              <p className="text-[11px] text-zinc-500">Present logs</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-1 shadow-xs">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Classes Missed</p>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-rose-700">
                {overallConducted - overallAttended}
              </p>
              <p className="text-[11px] text-zinc-500">Absences logged</p>
            </div>
          </div>

          {/* Per-Subject Breakdown List */}
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-sm uppercase tracking-wider text-zinc-500 px-1">
              Subject Attendance & Bunk Predictor ({subjectStats.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectStats.map(({ subject, totalConducted, totalAttended, totalAbsent, percentage, BunkMarginText, BunkMarginType }) => {
                const isAbove = percentage >= attendanceTarget;

                return (
                  <div
                    key={subject.id}
                    className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#A68942] uppercase tracking-wider">
                          {subject.code}
                        </span>
                        <h3 className="font-serif font-bold text-base text-[#1A1A1A] mt-0.5">
                          {subject.name}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Instructor: {subject.instructor}
                        </p>
                      </div>

                      <div className={`px-3 py-1.5 rounded-2xl text-right shrink-0 ${
                        isAbove ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <span className="font-serif font-bold text-lg block leading-none">{percentage}%</span>
                        <span className="text-[9px] font-bold uppercase">{isAbove ? 'On Track' : 'Shortage'}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-zinc-500">Attended: {totalAttended} / {totalConducted} classes</span>
                        <span className={isAbove ? 'text-emerald-700' : 'text-rose-700'}>Target: {attendanceTarget}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-[#F6F4F0] overflow-hidden border border-[#EAE7E0]">
                        <div
                          className={`h-full transition-all rounded-full ${
                            isAbove ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                        />
                      </div>
                    </div>

                    {/* Bunk Predictor Card */}
                    <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
                      BunkMarginType === 'safe'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : BunkMarginType === 'warning'
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900 font-bold'
                        : 'bg-[#F6F4F0] border-[#EAE7E0] text-zinc-700'
                    }`}>
                      {BunkMarginType === 'safe' ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : BunkMarginType === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      ) : (
                        <Calculator className="w-5 h-5 text-zinc-400 shrink-0" />
                      )}
                      <span>{BunkMarginText}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: WEEKLY TIMETABLE GRID & SLOT CREATION */}
      {/* ========================================================= */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Weekly Class Timetable
              </h2>
              <p className="text-xs text-zinc-500">
                Full weekly lecture and lab schedule across all active subjects
              </p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Plus className="w-4 h-4 text-[#A68942]" />
              <span>Add Timetable Slot</span>
            </button>
          </div>

          {/* Timetable Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DAYS_OF_WEEK.slice(0, 5).map((day) => {
              const daySlots = timetableSlots
                .filter(s => s.day === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <div
                  key={day}
                  className="p-4 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-3 min-h-[300px]"
                >
                  <div className="flex items-center justify-between border-b border-[#EAE7E0] pb-2">
                    <span className="font-serif font-bold text-xs uppercase text-[#1A1A1A] tracking-wider">
                      {day}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-zinc-400">
                      {daySlots.length} slots
                    </span>
                  </div>

                  <div className="space-y-2">
                    {daySlots.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic text-center py-8">No classes</p>
                    ) : (
                      daySlots.map((slot) => {
                        const subject = subjects.find(s => s.id === slot.subjectId);
                        return (
                          <div
                            key={slot.id}
                            className="p-3 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] space-y-1 relative group hover:border-[#A68942]/50 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-[#A68942]">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <button
                                onClick={() => onDeleteTimetableSlot(slot.id)}
                                className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition-opacity"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="font-serif font-bold text-xs text-[#1A1A1A] line-clamp-1">
                              {subject?.code}: {subject?.name.split('(')[0]}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                              <span>{slot.room}</span>
                              <span className="px-1.5 py-0.5 rounded bg-[#EAE7E0] text-zinc-700 font-bold">{slot.type}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD NEW TIMETABLE SLOT */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] max-w-md w-full space-y-5 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[#EAE7E0] pb-3">
              <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                Add Class to Timetable
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-600 mb-1">Subject</label>
                <select
                  value={newSlot.subjectId}
                  onChange={(e) => setNewSlot({ ...newSlot, subjectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942]"
                >
                  {subjects.length === 0 ? (
                    <option value="">General Class</option>
                  ) : (
                    subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.code} - {(s?.name || '')}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-600 mb-1">Day of Week</label>
                  <select
                    value={newSlot.day}
                    onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value as DayOfWeek })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942]"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-600 mb-1">Class Type</label>
                  <select
                    value={newSlot.type}
                    onChange={(e) => setNewSlot({ ...newSlot, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942]"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Lab</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-600 mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="09:00 AM"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-600 mb-1">End Time</label>
                  <input
                    type="text"
                    placeholder="10:00 AM"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-600 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    placeholder="LT-101"
                    value={newSlot.room}
                    onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-600 mb-1">Instructor (Optional)</label>
                  <input
                    type="text"
                    placeholder="Dr. Evelyn Vance"
                    value={newSlot.instructor}
                    onChange={(e) => setNewSlot({ ...newSlot, instructor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EAE7E0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 font-bold hover:bg-[#EAE7E0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] font-bold shadow-md hover:bg-[#333333]"
                >
                  Save Class Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
