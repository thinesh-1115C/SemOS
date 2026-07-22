import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Homepage } from './components/Homepage';
import { Dashboard } from './components/Dashboard';
import { SubjectWorkspace } from './components/SubjectWorkspace';
import { AITutorView } from './components/AITutorView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { CgpaCalculator } from './components/CgpaCalculator';
import { FlashcardView } from './components/FlashcardView';
import { QuizView } from './components/QuizView';
import { PDFBrainView } from './components/PDFBrainView';
import { CalendarView } from './components/CalendarView';
import { RevisionPlannerView } from './components/RevisionPlannerView';
import { WritingAssistantView } from './components/WritingAssistantView';
import { AnalyticsView } from './components/AnalyticsView';
import { TimetableAttendanceView } from './components/TimetableAttendanceView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AuthModal } from './components/AuthModal';
import { AccessRestrictedModal } from './components/AccessRestrictedModal';
import { AdminAllowlistModal } from './components/AdminAllowlistModal';
import { FirstTimeOnboardingCard } from './components/FirstTimeOnboardingCard';

import { 
  UserProfile, Subject, NoteItem, PDFDocument, Flashcard, Quiz, 
  AssignmentTask, CalendarEvent, StudyAnalyticsData, NotificationItem,
  TimetableSlot, AttendanceLog, AttendanceStatus, RevisionTask
} from './types';

import { 
  initialUser, initialSubjects, initialNotes, initialPDFs, 
  initialFlashcards, initialQuizzes, initialAssignments, 
  initialEvents, initialAnalytics, initialNotifications,
  initialTimetableSlots, initialAttendanceLogs, initialRevisionTasks
} from './data/initialData';

import { generateRevisionTasksForSession, triggerSpacedRepetition } from './lib/revisionAlgorithm';
import { isEmailAllowed } from './lib/authGuard';

import { 
  subscribeToAuthChanges, getUserProfile, 
  getUserRevisionTasks, saveUserRevisionTasksBatch, updateUserRevisionTask, logOut 
} from './lib/firebase';

export default function App() {
  // Navigation & View state
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // Firebase Auth State
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authRequiredMsg, setAuthRequiredMsg] = useState<string | null>(null);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAccessRestrictedOpen, setIsAccessRestrictedOpen] = useState(false);
  const [isAdminAllowlistOpen, setIsAdminAllowlistOpen] = useState(false);
  const [unauthorizedAttemptEmail, setUnauthorizedAttemptEmail] = useState<string | null>(null);

  // New Subject Form State
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubInstructor, setNewSubInstructor] = useState('');

  // Persistent App State with localStorage fallback
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('semos_user');
    return saved ? JSON.parse(saved) : initialUser;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('semos_subjects');
    return saved ? JSON.parse(saved) : initialSubjects;
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('semos_notes');
    return saved ? JSON.parse(saved) : initialNotes;
  });

  const [pdfs, setPdfs] = useState<PDFDocument[]>(() => {
    const saved = localStorage.getItem('semos_pdfs');
    return saved ? JSON.parse(saved) : initialPDFs;
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('semos_flashcards');
    return saved ? JSON.parse(saved) : initialFlashcards;
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem('semos_quizzes');
    return saved ? JSON.parse(saved) : initialQuizzes;
  });

  const [assignments, setAssignments] = useState<AssignmentTask[]>(() => {
    const saved = localStorage.getItem('semos_assignments');
    return saved ? JSON.parse(saved) : initialAssignments;
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('semos_events');
    return saved ? JSON.parse(saved) : initialEvents;
  });

  const [analytics] = useState<StudyAnalyticsData>(initialAnalytics);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('semos_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem('semos_timetable_slots');
    return saved ? JSON.parse(saved) : initialTimetableSlots;
  });

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(() => {
    const saved = localStorage.getItem('semos_attendance_logs');
    return saved ? JSON.parse(saved) : initialAttendanceLogs;
  });

  const [revisionTasks, setRevisionTasks] = useState<RevisionTask[]>(() => {
    const saved = localStorage.getItem('semos_revision_tasks');
    return saved ? JSON.parse(saved) : initialRevisionTasks;
  });

  useEffect(() => {
    localStorage.setItem('semos_timetable_slots', JSON.stringify(timetableSlots));
  }, [timetableSlots]);

  useEffect(() => {
    localStorage.setItem('semos_attendance_logs', JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  useEffect(() => {
    localStorage.setItem('semos_revision_tasks', JSON.stringify(revisionTasks));
  }, [revisionTasks]);

  // Subscribe to Firebase Authentication Changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      if (fbUser) {
        // Intercept and check allowlist if enabled
        if (!isEmailAllowed(fbUser.email)) {
          setUnauthorizedAttemptEmail(fbUser.email);
          setIsAccessRestrictedOpen(true);
          await logOut();
          setAuthUid(null);
          setAuthEmail(null);
          return;
        }

        setAuthUid(fbUser.uid);
        setAuthEmail(fbUser.email);
        setUser(prev => ({
          ...prev,
          name: fbUser.displayName || prev.name,
          email: fbUser.email || prev.email,
        }));

        // Load Firestore profile if present
        const dbProfile = await getUserProfile(fbUser.uid);
        if (dbProfile) {
          setUser(prev => ({
            ...prev,
            targetGpa: dbProfile.targetCgpa || prev.targetGpa,
            major: dbProfile.major || prev.major,
            semester: dbProfile.semester || prev.semester,
          }));
        }

        // Load user revision tasks from Firestore if present
        const dbRevTasks = await getUserRevisionTasks(fbUser.uid);
        if (dbRevTasks && dbRevTasks.length > 0) {
          setRevisionTasks(dbRevTasks as RevisionTask[]);
        }
      } else {
        setAuthUid(null);
        setAuthEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync state to localStorage
  useEffect(() => { localStorage.setItem('semos_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('semos_subjects', JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('semos_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('semos_pdfs', JSON.stringify(pdfs)); }, [pdfs]);
  useEffect(() => { localStorage.setItem('semos_flashcards', JSON.stringify(flashcards)); }, [flashcards]);
  useEffect(() => { localStorage.setItem('semos_quizzes', JSON.stringify(quizzes)); }, [quizzes]);
  useEffect(() => { localStorage.setItem('semos_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('semos_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('semos_notifications', JSON.stringify(notifications)); }, [notifications]);

  // Protected Route Check Handler
  const handleSelectNavView = (view: string) => {
    // Restrict AI Tutor, AI Study Planner, and Revision Calendar to authenticated users
    const protectedViews = ['ai-tutor', 'study-planner', 'calendar'];
    if (protectedViews.includes(view) && !authUid) {
      setAuthRequiredMsg(`Please sign in with Firebase to access ${view === 'ai-tutor' ? 'AI Tutor Hub' : view === 'study-planner' ? 'Automated AI Study Planner' : 'Revision Calendar'}.`);
      setIsAuthOpen(true);
      return;
    }

    setActiveView(view);
  };

  // Command-K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for data updates
  const handleAddNote = (newNoteData: Omit<NoteItem, 'id' | 'updatedAt'>) => {
    const note: NoteItem = {
      ...newNoteData,
      id: `n_${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setNotes(prev => [note, ...prev]);
  };

  const handleAddPDF = (newPdfData: Omit<PDFDocument, 'id' | 'uploadDate'>) => {
    const pdf: PDFDocument = {
      ...newPdfData,
      id: `pdf_${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
    };
    setPdfs(prev => [pdf, ...prev]);
  };

  const handleAddFlashcard = (cardData: Omit<Flashcard, 'id' | 'nextReviewDate' | 'intervalDays' | 'reviewCount' | 'easeFactor'>) => {
    const card: Flashcard = {
      ...cardData,
      id: `fc_${Date.now()}`,
      nextReviewDate: new Date().toISOString().split('T')[0],
      intervalDays: 1,
      reviewCount: 0,
      easeFactor: 2.5,
    };
    setFlashcards(prev => [card, ...prev]);
  };

  const handleUpdateFlashcardReview = (id: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    setFlashcards(prev => prev.map(card => {
      if (card.id !== id) return card;
      let newInterval = card.intervalDays;
      if (rating === 'again') newInterval = 1;
      else if (rating === 'hard') newInterval = Math.max(2, Math.round(card.intervalDays * 1.2));
      else if (rating === 'good') newInterval = Math.max(4, Math.round(card.intervalDays * 2.0));
      else if (rating === 'easy') newInterval = Math.max(7, Math.round(card.intervalDays * 2.5));

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + newInterval);

      return {
        ...card,
        intervalDays: newInterval,
        reviewCount: card.reviewCount + 1,
        lastReviewed: new Date().toISOString().split('T')[0],
        nextReviewDate: nextDate.toISOString().split('T')[0],
      };
    }));

    setUser(prev => ({ ...prev, xp: prev.xp + 15 }));
  };

  const handleSaveQuizResult = (completedQuiz: Quiz) => {
    setQuizzes(prev => [completedQuiz, ...prev.filter(q => q.id !== completedQuiz.id)]);
    setUser(prev => ({ ...prev, xp: prev.xp + 50 }));
  };

  const handleAddEvent = (eventData: Omit<CalendarEvent, 'id' | 'completed'>) => {
    const event: CalendarEvent = {
      ...eventData,
      id: `ev_${Date.now()}`,
      completed: false,
    };
    setEvents(prev => [event, ...prev]);
  };

  const handleToggleEventComplete = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const handleLoadSampleData = () => {
    setSubjects(initialSubjects);
    setTimetableSlots(initialTimetableSlots);
    setAttendanceLogs(initialAttendanceLogs);
    setRevisionTasks(initialRevisionTasks);
    setNotes(initialNotes);
    setFlashcards(initialFlashcards);
    setQuizzes(initialQuizzes);
  };

  const handleAddSubject = () => {
    if (!newSubName.trim() || !newSubCode.trim()) return;
    const newSub: Subject = {
      id: `sub_${Date.now()}`,
      code: newSubCode.toUpperCase(),
      name: newSubName,
      semester: user.semester,
      color: 'from-purple-600 to-indigo-700',
      icon: 'BookOpen',
      instructor: newSubInstructor || 'University Professor',
      attendancePercent: 100,
      weakAreas: ['Course Intro'],
      masteryPercent: 50,
    };
    setSubjects(prev => [...prev, newSub]);
    setNewSubName('');
    setNewSubCode('');
    setNewSubInstructor('');
    setIsAddSubjectOpen(false);
  };

  const handleMarkNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleAddTimetableSlot = (slotData: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `ts_${Date.now()}`,
    };
    setTimetableSlots(prev => [...prev, newSlot]);
  };

  const handleDeleteTimetableSlot = (slotId: string) => {
    setTimetableSlots(prev => prev.filter(s => s.id !== slotId));
  };

  const handleLogAttendance = (logData: Omit<AttendanceLog, 'id' | 'timestamp'>) => {
    const existingIndex = attendanceLogs.findIndex(
      l => l.slotId === logData.slotId && l.date === logData.date
    );
    const timestamp = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated = [...attendanceLogs];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status: logData.status,
        timestamp,
      };
      setAttendanceLogs(updated);
    } else {
      const newLog: AttendanceLog = {
        ...logData,
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp,
      };
      setAttendanceLogs(prev => [...prev, newLog]);
    }
  };

  const handleBatchLogAttendance = (date: string, slots: TimetableSlot[], status: AttendanceStatus) => {
    const timestamp = new Date().toISOString();
    setAttendanceLogs(prev => {
      const updated = [...prev];
      slots.forEach(slot => {
        const idx = updated.findIndex(l => l.slotId === slot.id && l.date === date);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], status, timestamp };
        } else {
          updated.push({
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            date,
            slotId: slot.id,
            subjectId: slot.subjectId,
            status,
            timestamp,
          });
        }
      });
      return updated;
    });
  };

  // Integration Handlers: AI Study Planner <-> Revision Planner
  const handleStudySessionCompleted = (session: {
    sourceSessionId: string;
    topic: string;
    subjectId: string;
    subjectCode: string;
    subjectName?: string;
    completed: boolean;
    completionDate?: string;
  }) => {
    if (session.completed) {
      // Auto-generate 5 revision tasks (Day 1, Day 2, Day 5, Day 10, Day 30) via triggerSpacedRepetition
      const newTasks = triggerSpacedRepetition({
        id: session.sourceSessionId,
        topic: session.topic,
        subjectId: session.subjectId,
        subjectCode: session.subjectCode,
        subjectName: session.subjectName,
        completionDate: session.completionDate,
      });

      setRevisionTasks(prev => {
        const filtered = prev.filter(t => t.sourceSessionId !== session.sourceSessionId);
        return [...filtered, ...newTasks];
      });

      if (authUid) {
        saveUserRevisionTasksBatch(authUid, newTasks);
      }

      // Add a notification for user visibility
      const newNotif: NotificationItem = {
        id: `notif_rev_${Date.now()}`,
        title: 'Spaced Revision Tasks Scheduled',
        message: `Auto-generated Day 1, 2, 5, 10, 30 revision tasks for "${session.topic}".`,
        time: 'Just now',
        read: false,
        type: 'revision',
      };
      setNotifications(prev => [newNotif, ...prev]);

    } else {
      // Uncompleted: remove linked revision tasks
      setRevisionTasks(prev => prev.filter(t => t.sourceSessionId !== session.sourceSessionId));
    }
  };

  const handleToggleRevisionTask = (taskId: string) => {
    setRevisionTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const isNowCompleted = !t.completed;
          const updated: RevisionTask = {
            ...t,
            completed: isNowCompleted,
            completedAt: isNowCompleted ? new Date().toISOString() : undefined,
          };
          if (authUid) {
            updateUserRevisionTask(authUid, taskId, {
              completed: isNowCompleted,
              completedAt: isNowCompleted ? updated.completedAt : null,
            });
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddRevisionTasks = (newTasks: RevisionTask[]) => {
    setRevisionTasks(prev => [...prev, ...newTasks]);
    if (authUid) {
      saveUserRevisionTasksBatch(authUid, newTasks);
    }
  };

  const handleDeleteTopicGroup = (sourceSessionId: string, topic: string) => {
    setRevisionTasks(prev =>
      prev.filter(
        t => !(t.sourceSessionId === sourceSessionId || t.topic.toLowerCase() === topic.toLowerCase())
      )
    );
  };

  const activeSubject = subjects.find(s => s.id === activeSubjectId) || subjects[0];

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#1A1A1A] font-sans selection:bg-[#A68942]/20 selection:text-[#1A1A1A] flex flex-col">
      
      {/* Top Navigation Bar */}
      <Navbar
        user={user}
        activeView={activeView}
        setActiveView={handleSelectNavView}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => {
          setAuthRequiredMsg(null);
          setIsAuthOpen(true);
        }}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
      />

      {/* Main Workspace Layout */}
      {activeView === 'homepage' ? (
        <Homepage onLaunchApp={() => handleSelectNavView('dashboard')} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Navigation Sidebar */}
          <Sidebar
            activeView={activeView}
            setActiveView={handleSelectNavView}
            subjects={subjects}
            activeSubjectId={activeSubjectId}
            setActiveSubjectId={setActiveSubjectId}
            onAddSubjectClick={() => setIsAddSubjectOpen(true)}
          />

          {/* Main Content View Container */}
          <main className="flex-1 overflow-y-auto bg-[#FBFBF9]">
            {activeView === 'dashboard' && (
              <Dashboard
                user={user}
                subjects={subjects}
                notes={notes}
                flashcards={flashcards}
                quizzes={quizzes}
                events={events}
                analytics={analytics}
                authUid={authUid}
                setActiveView={handleSelectNavView}
                setActiveSubjectId={setActiveSubjectId}
                onOpenAddSubject={() => setIsAddSubjectOpen(true)}
                onLoadSampleData={handleLoadSampleData}
              />
            )}

            {activeView === 'timetable' && (
              <TimetableAttendanceView
                subjects={subjects}
                timetableSlots={timetableSlots}
                attendanceLogs={attendanceLogs}
                onAddTimetableSlot={handleAddTimetableSlot}
                onDeleteTimetableSlot={handleDeleteTimetableSlot}
                onLogAttendance={handleLogAttendance}
                onBatchLogAttendance={handleBatchLogAttendance}
              />
            )}

            {activeView === 'subject' && activeSubject && (
              <SubjectWorkspace
                subject={activeSubject}
                notes={notes}
                pdfs={pdfs}
                flashcards={flashcards}
                quizzes={quizzes}
                assignments={assignments}
                onAddNote={handleAddNote}
                onAddPDF={handleAddPDF}
                onAddFlashcard={handleAddFlashcard}
                onBack={() => handleSelectNavView('dashboard')}
              />
            )}

            {activeView === 'ai-tutor' && (
              <AITutorView
                subjects={subjects}
                user={user}
                initialSubjectId={activeSubjectId || undefined}
              />
            )}

            {activeView === 'study-planner' && (
              <StudyPlannerView
                user={user}
                subjects={subjects}
                authUid={authUid}
                onStudySessionCompleted={handleStudySessionCompleted}
              />
            )}

            {activeView === 'cgpa-calculator' && (
              <CgpaCalculator
                user={user}
                onUpdateUser={(updated) => setUser(prev => ({ ...prev, ...updated }))}
                authUid={authUid}
                initialTargetCgpa={user?.targetGpa || 9.0}
              />
            )}

            {activeView === 'flashcards' && (
              <FlashcardView
                subjects={subjects}
                flashcards={flashcards}
                onAddFlashcard={handleAddFlashcard}
                onUpdateFlashcardReview={handleUpdateFlashcardReview}
              />
            )}

            {activeView === 'quiz-generator' && (
              <QuizView
                subjects={subjects}
                quizzes={quizzes}
                onSaveQuizResult={handleSaveQuizResult}
                onAddFlashcard={handleAddFlashcard}
              />
            )}

            {activeView === 'pdf-brain' && (
              <PDFBrainView
                subjects={subjects}
                pdfs={pdfs}
                onAddPDF={handleAddPDF}
              />
            )}

            {activeView === 'calendar' && (
              <RevisionPlannerView
                subjects={subjects}
                revisionTasks={revisionTasks}
                onToggleRevisionTask={handleToggleRevisionTask}
                onAddRevisionTasks={handleAddRevisionTasks}
                onDeleteTopicGroup={handleDeleteTopicGroup}
                onNavigateToAITutor={(topic, subjectId) => {
                  setActiveSubjectId(subjectId);
                  handleSelectNavView('ai-tutor');
                }}
              />
            )}

            {activeView === 'writing-assistant' && (
              <WritingAssistantView />
            )}

            {activeView === 'analytics' && (
              <AnalyticsView
                user={user}
                analytics={analytics}
              />
            )}
          </main>

        </div>
      )}

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        subjects={subjects}
        notes={notes}
        pdfs={pdfs}
        flashcards={flashcards}
        quizzes={quizzes}
        onSelectResult={(view, subjectId) => {
          handleSelectNavView(view);
          if (subjectId) setActiveSubjectId(subjectId);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthRequiredMsg(null);
        }}
        user={user}
        onUpdateUser={(updated) => setUser(prev => ({ ...prev, ...updated }))}
        authUid={authUid}
        authEmail={authEmail}
        requiredMessage={authRequiredMsg}
        onOpenAdmin={() => setIsAdminAllowlistOpen(true)}
      />

      <AccessRestrictedModal
        isOpen={isAccessRestrictedOpen}
        onClose={() => setIsAccessRestrictedOpen(false)}
        attemptedEmail={unauthorizedAttemptEmail}
        onOpenAdmin={() => setIsAdminAllowlistOpen(true)}
      />

      <AdminAllowlistModal
        isOpen={isAdminAllowlistOpen}
        onClose={() => setIsAdminAllowlistOpen(false)}
      />

      {/* Add New Subject Modal */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FBFBF9] border border-[#EAE7E0] rounded-3xl p-6 shadow-2xl text-[#1A1A1A] space-y-4">
            <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">Add New Course / Subject</h2>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-600 font-semibold block mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems & Kernel Architecture"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942]"
                />
              </div>

              <div>
                <label className="text-zinc-600 font-semibold block mb-1">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. CS302"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942]"
                />
              </div>

              <div>
                <label className="text-zinc-600 font-semibold block mb-1">Instructor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Linus Torvalds"
                  value={newSubInstructor}
                  onChange={(e) => setNewSubInstructor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-medium focus:outline-none focus:border-[#A68942]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddSubjectOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F6F4F0] hover:bg-[#EAE7E0] text-zinc-700 text-xs font-semibold border border-[#EAE7E0]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                className="px-5 py-2 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] font-semibold text-xs hover:bg-[#333333] transition-colors shadow-sm"
              >
                Create Subject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
