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
  onUpdateTimetableSlot?: (slotId: string, slotData: Partial<TimetableSlot>) => void;
  onDeleteTimetableSlot: (slotId: string) => void;
  onDeleteMultipleTimetableSlots?: (slotIds: string[]) => void;
  onLogAttendance: (log: Omit<AttendanceLog, 'id' | 'timestamp'> & { status?: AttendanceStatus | null }) => void;
  onBatchLogAttendance: (date: string, slots: TimetableSlot[], status: AttendanceStatus) => void;
  onManualAdjustAttendance?: (subjectId: string, addAttended: number, addConducted: number) => void;
  onClearDayAttendance?: (date: string) => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3] ? match[3].toUpperCase() : null;

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

export const TimetableAttendanceView: React.FC<TimetableAttendanceViewProps> = ({
  subjects,
  timetableSlots,
  attendanceLogs,
  onAddTimetableSlot,
  onUpdateTimetableSlot,
  onDeleteTimetableSlot,
  onDeleteMultipleTimetableSlots,
  onLogAttendance,
  onBatchLogAttendance,
  onManualAdjustAttendance,
  onClearDayAttendance,
}) => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'weekly' | 'stats'>('checkin');

  // Selected Date for Daily Check-In
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [attendanceTarget, setAttendanceTarget] = useState<number>(75);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('All');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Manual Adjust Modal State
  const [adjustingSubject, setAdjustingSubject] = useState<{ id: string; name: string; code: string } | null>(null);
  const [manualAttendedInput, setManualAttendedInput] = useState<number>(1);
  const [manualConductedInput, setManualConductedInput] = useState<number>(1);

  // Modal State for adding new Timetable Slot
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSubjectOption, setSelectedSubjectOption] = useState<string>(subjects[0]?.id || 'custom');
  const [customSubjectName, setCustomSubjectName] = useState<string>(subjects[0]?.name || 'Digital Electronics');
  const [customSubjectCode, setCustomSubjectCode] = useState<string>(subjects[0]?.code || 'ECE401');

  const [newSlot, setNewSlot] = useState({
    day: 'Monday' as DayOfWeek,
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    room: 'LT-101',
    type: 'Lecture' as 'Lecture' | 'Lab' | 'Tutorial' | 'Seminar',
    instructor: '',
  });

  const handleSubjectOptionChange = (optValue: string) => {
    setSelectedSubjectOption(optValue);
    if (optValue !== 'custom') {
      const found = subjects.find(s => s.id === optValue);
      if (found) {
        setCustomSubjectName(found.name);
        setCustomSubjectCode(found.code);
      }
    }
  };

  // Calculate day of week from selectedDate without timezone shifts
  const getDayFromDate = (dateStr: string): DayOfWeek => {
    if (!dateStr) return 'Monday';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      const dateObj = new Date(year, month, day, 12, 0, 0);
      const dayIndex = dateObj.getDay(); // 0 is Sun, 1 is Mon...
      const map: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return map[dayIndex];
    }
    return 'Monday';
  };

  const selectedDay = getDayFromDate(selectedDate);

  // Filter & chronologically sort slots for current day
  const todaySlots = timetableSlots
    .filter(slot => slot.day === selectedDay)
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

  // Helper to find log for a given date and slotId
  const getLogForSlot = (slotId: string, dateStr: string) => {
    return attendanceLogs.find(log => log.slotId === slotId && log.date === dateStr);
  };

  // Subject-level Attendance Metrics Calculation (Handles enrolled & custom classes)
  const trackedSubjectsMap = new Map<string, { id: string; name: string; code: string; instructor: string; attendancePercent: number }>();

  subjects.forEach(sub => {
    trackedSubjectsMap.set(sub.id, {
      id: sub.id,
      name: sub.name,
      code: sub.code,
      instructor: sub.instructor || '',
      attendancePercent: sub.attendancePercent || 0,
    });
  });

  timetableSlots.forEach(slot => {
    const matchedSubject = subjects.find(s => s.id === slot.subjectId);
    const code = slot.customSubjectCode || matchedSubject?.code || 'GEN101';
    const name = slot.customSubjectName || matchedSubject?.name || 'Class Subject';
    const key = slot.subjectId && slot.subjectId !== 'custom' && trackedSubjectsMap.has(slot.subjectId)
      ? slot.subjectId
      : `custom_${code}_${name}`;

    if (!trackedSubjectsMap.has(key)) {
      trackedSubjectsMap.set(key, {
        id: slot.subjectId || key,
        name,
        code,
        instructor: slot.instructor || '',
        attendancePercent: 0,
      });
    }
  });

  const slotById = new Map<string, TimetableSlot>(timetableSlots.map(s => [s.id, s]));

  const subjectStats = Array.from(trackedSubjectsMap.values()).map(sub => {
    const subLogs = attendanceLogs.filter(log => {
      if (log.subjectId === sub.id) return true;
      const slot = slotById.get(log.slotId);
      if (slot) {
        const matchedSubject = subjects.find(s => s.id === slot.subjectId);
        const slotCode = slot.customSubjectCode || matchedSubject?.code || 'GEN101';
        const slotName = slot.customSubjectName || matchedSubject?.name || 'Class Subject';
        if (slotCode === sub.code && slotName === sub.name) return true;
      }
      return false;
    });

    const totalConducted = subLogs.filter(l => l.status === 'present' || l.status === 'absent').length;
    const totalAttended = subLogs.filter(l => l.status === 'present').length;
    const totalAbsent = subLogs.filter(l => l.status === 'absent').length;
    const totalCancelled = subLogs.filter(l => l.status === 'cancelled').length;

    const percentage = totalConducted > 0 
      ? Math.round((totalAttended / totalConducted) * 100) 
      : (sub.attendancePercent || 0);

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
    : (subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.attendancePercent, 0) / subjects.length) : 100);

  const handleOpenAddModal = () => {
    setEditingSlotId(null);
    setSelectedSubjectOption(subjects[0]?.id || 'custom');
    setCustomSubjectName(subjects[0]?.name || '');
    setCustomSubjectCode(subjects[0]?.code || '');
    setNewSlot({
      day: selectedDay || 'Monday',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      room: 'LT-101',
      type: 'Lecture',
      instructor: '',
    });
    setIsAddModalOpen(true);
  };

  const handleStartEditSlot = (slot: TimetableSlot) => {
    setEditingSlotId(slot.id);
    setSelectedSubjectOption(slot.subjectId || 'custom');
    setCustomSubjectName(slot.customSubjectName || '');
    setCustomSubjectCode(slot.customSubjectCode || '');
    setNewSlot({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room || 'LT-101',
      type: slot.type || 'Lecture',
      instructor: slot.instructor || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customSubjectName.trim() || 'General Class';
    const finalCode = customSubjectCode.trim() || 'GEN101';
    
    const matchedSubject = subjects.find(s => s.id === selectedSubjectOption);

    const slotPayload = {
      subjectId: matchedSubject ? matchedSubject.id : (selectedSubjectOption || 'custom'),
      customSubjectName: finalName,
      customSubjectCode: finalCode,
      day: newSlot.day,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      room: newSlot.room || 'LT-101',
      type: newSlot.type,
      instructor: newSlot.instructor,
    };

    if (editingSlotId && onUpdateTimetableSlot) {
      onUpdateTimetableSlot(editingSlotId, slotPayload);
    } else {
      onAddTimetableSlot(slotPayload);
    }
    setIsAddModalOpen(false);
    setEditingSlotId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#1A1A1A]">
      
      {/* Tab Switcher Navigation */}
      <div className="flex justify-end">
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
                {todaySlots.map((slot, idx) => {
                  const subject = subjects.find(s => s.id === slot.subjectId);
                  const displayCode = slot.customSubjectCode || subject?.code || 'GEN101';
                  const displayName = slot.customSubjectName || subject?.name || 'Class Subject';
                  const existingLog = getLogForSlot(slot.id, selectedDate);
                  const currentStatus = existingLog?.status;

                  return (
                    <div
                      key={slot.id ? `${slot.id}-${idx}` : idx}
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
                              {displayCode}
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
                            {displayName} <span className="font-sans text-xs font-semibold text-zinc-500">({displayCode})</span>
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

                          {/* Remove Slot Button */}
                          <button
                            onClick={() => {
                              onDeleteTimetableSlot(slot.id);
                            }}
                            title="Remove Class Slot"
                            className="p-2.5 rounded-2xl bg-[#F6F4F0] hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-[#EAE7E0] hover:border-rose-300 font-bold text-xs transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
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

            {subjectStats.length === 0 ? (
              <div className="p-12 text-center bg-[#FBFBF9] rounded-3xl border border-[#EAE7E0] space-y-3">
                <BarChart2 className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="font-serif font-bold text-sm text-[#1A1A1A]">No Subject Attendance Stats Available</p>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Add class slots to your weekly timetable or check in daily to generate real-time attendance analytics and 75% target recovery predictions.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-[#A68942]" />
                  <span>Add Class Slot</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectStats.map(({ subject, totalConducted, totalAttended, totalAbsent, percentage, BunkMarginText, BunkMarginType }, idx) => {
                  const isAbove = percentage >= attendanceTarget;

                  return (
                    <div
                      key={subject.id ? `${subject.id}-${idx}` : idx}
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
                          {subject.instructor && (
                            <p className="text-xs text-zinc-500 mt-0.5">
                              Instructor: {subject.instructor}
                            </p>
                          )}
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
            )}
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

            <div className="flex items-center gap-2">
              {timetableSlots.length > 0 && (
                <button
                  onClick={() => {
                    if (onDeleteMultipleTimetableSlots) {
                      onDeleteMultipleTimetableSlots(timetableSlots.map(s => s.id));
                    } else {
                      timetableSlots.forEach(s => onDeleteTimetableSlot(s.id));
                    }
                  }}
                  className="px-3 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Remove all slots from weekly schedule"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear All Schedule ({timetableSlots.length})</span>
                </button>
              )}

              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Plus className="w-4 h-4 text-[#A68942]" />
                <span>Add Timetable Slot</span>
              </button>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DAYS_OF_WEEK.slice(0, 5).map((day) => {
              const daySlots = timetableSlots
                .filter(s => s.day === day)
                .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

              return (
                <div
                  key={day}
                  className="p-4 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-3 min-h-[300px]"
                >
                  <div className="flex items-center justify-between border-b border-[#EAE7E0] pb-2">
                    <span className="font-serif font-bold text-xs uppercase text-[#1A1A1A] tracking-wider">
                      {day}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-zinc-400">
                        {daySlots.length} slots
                      </span>
                      {daySlots.length > 0 && (
                        <button
                          onClick={() => {
                            if (onDeleteMultipleTimetableSlots) {
                              onDeleteMultipleTimetableSlots(daySlots.map(s => s.id));
                            } else {
                              daySlots.forEach(s => onDeleteTimetableSlot(s.id));
                            }
                          }}
                          className="text-[10px] text-rose-600 hover:text-rose-800 p-0.5 rounded hover:bg-rose-50 font-bold transition-all"
                          title={`Remove all ${day} slots`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {daySlots.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic text-center py-8">No classes</p>
                    ) : (
                      daySlots.map((slot, idx) => {
                        const subject = subjects.find(s => s.id === slot.subjectId);
                        const displayCode = slot.customSubjectCode || subject?.code || 'GEN101';
                        const displayName = slot.customSubjectName || subject?.name || 'Class Subject';

                        return (
                          <div
                            key={slot.id ? `${slot.id}-${idx}` : idx}
                            className="p-3 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] space-y-1 relative group hover:border-[#A68942]/50 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-[#A68942]">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStartEditSlot(slot)}
                                  className="p-1 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/70 transition-all"
                                  title="Edit Class Slot"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (!window.confirm || window.confirm(`Remove "${displayName}" slot (${slot.startTime})?`)) {
                                      onDeleteTimetableSlot(slot.id);
                                    }
                                  }}
                                  className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 transition-all"
                                  title="Remove Class Slot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="font-serif font-bold text-xs text-[#1A1A1A] line-clamp-2">
                              {displayName} <span className="font-mono text-[10px] font-bold text-zinc-500">({displayCode})</span>
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
                {editingSlotId ? 'Edit Class Slot' : 'Add Class to Timetable'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              
              {/* Optional Enrolled Subject Quick Select */}
              <div>
                <label className="block font-bold text-zinc-600 mb-1">Enrolled Subject Preset (Optional)</label>
                <select
                  value={selectedSubjectOption}
                  onChange={(e) => handleSubjectOptionChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942]"
                >
                  {subjects.map((s, idx) => (
                    <option key={s.id ? `${s.id}-${idx}` : idx} value={s.id}>{s.code} - {(s?.name || '')}</option>
                  ))}
                  <option value="custom">+ Type Custom Subject Name & Code</option>
                </select>
              </div>

              {/* Typeable Subject Name and Subject Code Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0]">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Subject Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Digital Electronics"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAE7E0] text-[#1A1A1A] font-semibold focus:outline-none focus:border-[#A68942]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Subject Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ECE401"
                    value={customSubjectCode}
                    onChange={(e) => setCustomSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAE7E0] text-[#1A1A1A] font-mono font-bold focus:outline-none focus:border-[#A68942]"
                  />
                </div>
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

              {/* Timeslot Management Controls */}
              <div className="space-y-2">
                <label className="block font-bold text-zinc-600">Timeslot Preset Shortcuts</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { start: '08:00 AM', end: '09:00 AM' },
                    { start: '09:00 AM', end: '10:00 AM' },
                    { start: '10:15 AM', end: '11:45 AM' },
                    { start: '12:00 PM', end: '01:00 PM' },
                    { start: '02:00 PM', end: '03:30 PM' },
                    { start: '03:30 PM', end: '05:00 PM' },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.start}
                      onClick={() => setNewSlot({ ...newSlot, startTime: preset.start, endTime: preset.end })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                        newSlot.startTime === preset.start && newSlot.endTime === preset.end
                          ? 'bg-[#1A1A1A] text-[#A68942] border-[#1A1A1A]'
                          : 'bg-[#F6F4F0] text-zinc-600 border-[#EAE7E0] hover:bg-[#EAE7E0]'
                      }`}
                    >
                      {preset.start} - {preset.end}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-600 mb-1">Custom Start Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-mono focus:outline-none focus:border-[#A68942]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-600 mb-1">Custom End Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-mono focus:outline-none focus:border-[#A68942]"
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
                  {editingSlotId ? 'Update Class Slot' : 'Save Class Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
