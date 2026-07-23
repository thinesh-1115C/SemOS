import { 
  UserProfile, Subject, NoteItem, PDFDocument, Flashcard, Quiz, 
  AssignmentTask, CalendarEvent, StudyAnalyticsData, NotificationItem, 
  TimetableSlot, AttendanceLog, RevisionTask 
} from '../types';

export const initialUser: UserProfile = {
  id: 'usr_clean',
  name: 'Student Workspace',
  email: '',
  avatar: '',
  major: 'Academic Studies',
  semester: 'Current Semester',
  targetGpa: 4.0,
  xp: 0,
  level: 1,
  streakDays: 0,
  lastStudyDate: new Date().toISOString().split('T')[0],
  badges: [],
};

export const initialSubjects: Subject[] = [];

export const initialNotes: NoteItem[] = [];

export const initialPDFs: PDFDocument[] = [];

export const initialFlashcards: Flashcard[] = [];

export const initialQuizzes: Quiz[] = [];

export const initialAssignments: AssignmentTask[] = [];

export const initialEvents: CalendarEvent[] = [];

export const initialAnalytics: StudyAnalyticsData = {
  dailyHours: [
    { day: 'Mon', hours: 0, target: 4.0 },
    { day: 'Tue', hours: 0, target: 4.0 },
    { day: 'Wed', hours: 0, target: 4.0 },
    { day: 'Thu', hours: 0, target: 4.0 },
    { day: 'Fri', hours: 0, target: 4.0 },
    { day: 'Sat', hours: 0, target: 4.0 },
    { day: 'Sun', hours: 0, target: 4.0 },
  ],
  subjectMastery: [],
  quizAccuracy: [],
  forgettingCurve: [],
};

export const initialNotifications: NotificationItem[] = [];

export const initialTimetableSlots: TimetableSlot[] = [];

export const initialAttendanceLogs: AttendanceLog[] = [];

export const initialRevisionTasks: RevisionTask[] = [];
