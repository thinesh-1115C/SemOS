export type TutorMode = 'explain' | 'beginner' | 'expert' | 'exam' | 'interview' | 'feynman';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  major: string;
  semester: string;
  targetGpa: number;
  xp: number;
  level: number;
  streakDays: number;
  lastStudyDate: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category: 'streak' | 'quiz' | 'feynman' | 'notes';
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester: string;
  color: string;
  icon: string;
  instructor: string;
  attendancePercent: number;
  nextExamDate?: string;
  weakAreas: string[];
  masteryPercent: number;
}

export interface NoteItem {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  aiSummarized?: boolean;
  linkedPdfId?: string;
}

export interface PDFDocument {
  id: string;
  subjectId: string;
  title: string;
  fileSize: string;
  uploadDate: string;
  pageCount: number;
  extractedText: string;
  summary?: string;
  formulas?: string[];
  keyConcepts?: string[];
  fileUrl?: string;
  extractedKeyPoints?: string[];
}

export interface Flashcard {
  id: string;
  subjectId: string;
  topic: string;
  front: string;
  back: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  lastReviewed?: string;
  nextReviewDate: string;
  intervalDays: number;
  reviewCount: number;
  easeFactor: number;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'fill_blank' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  subjectId: string;
  title: string;
  topic: string;
  questions: QuizQuestion[];
  score?: number;
  completedAt?: string;
}

export interface AssignmentTask {
  id: string;
  subjectId: string;
  title: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  weightagePercent: number;
}

export interface CalendarEvent {
  id: string;
  subjectId?: string;
  title: string;
  date: string;
  type: 'exam' | 'assignment' | 'lab' | 'revision' | 'study_session';
  completed: boolean;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  mode?: TutorMode;
  subjectId?: string;
}

export interface StudyAnalyticsData {
  dailyHours: { day: string; hours: number; target: number }[];
  subjectMastery: { subject: string; score: number }[];
  quizAccuracy: { week: string; score: number }[];
  forgettingCurve: { day: number; retention: number }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'revision' | 'exam' | 'achievement' | 'quiz';
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type AttendanceStatus = 'present' | 'absent' | 'cancelled';

export interface TimetableSlot {
  id: string;
  subjectId: string;
  day: DayOfWeek;
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "10:00 AM"
  room: string;      // e.g. "LT-301"
  type: 'Lecture' | 'Lab' | 'Tutorial' | 'Seminar';
  instructor?: string;
}

export interface AttendanceLog {
  id: string;
  date: string; // YYYY-MM-DD
  slotId: string;
  subjectId: string;
  status: AttendanceStatus;
  timestamp: string;
  notes?: string;
}

export interface RevisionTask {
  id: string;
  sourceSessionId: string;
  subjectId: string;
  subjectCode: string;
  subjectName?: string;
  topic: string;
  completionDate: string; // YYYY-MM-DD completion date of original study session
  dayInterval: 1 | 2 | 5 | 10 | 30; // Day 1, Day 2, Day 5, Day 10, Day 30
  scheduledDate: string; // YYYY-MM-DD target revision date
  completed: boolean;
  completedAt?: string;
}

export interface TopicRevisionGroup {
  topic: string;
  subjectId: string;
  subjectCode: string;
  subjectName?: string;
  sourceSessionId: string;
  completionDate: string;
  tasks: RevisionTask[];
  completedCount: number;
  totalCount: number;
  percent: number;
}
