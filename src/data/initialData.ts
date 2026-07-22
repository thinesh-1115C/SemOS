import { UserProfile, Subject, NoteItem, PDFDocument, Flashcard, Quiz, AssignmentTask, CalendarEvent, StudyAnalyticsData, NotificationItem, TimetableSlot, AttendanceLog, RevisionTask } from '../types';

export const initialUser: UserProfile = {
  id: 'usr_001',
  name: 'Alex Rivera',
  email: 'alex.rivera@university.edu',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  major: 'Computer Science & Engineering',
  semester: 'Semester 3',
  targetGpa: 3.85,
  xp: 2450,
  level: 6,
  streakDays: 14,
  lastStudyDate: new Date().toISOString().split('T')[0],
  badges: [
    {
      id: 'b1',
      title: '14-Day Flame',
      description: 'Maintained a 14-day study streak',
      icon: '🔥',
      unlockedAt: '2026-07-20',
      category: 'streak',
    },
    {
      id: 'b2',
      title: 'Feynman Master',
      description: 'Explained 5 complex topics in Feynman Mode',
      icon: '💡',
      unlockedAt: '2026-07-18',
      category: 'feynman',
    },
    {
      id: 'b3',
      title: 'Quiz Ace',
      description: 'Scored 100% on 3 subject quizzes',
      icon: '🎯',
      unlockedAt: '2026-07-15',
      category: 'quiz',
    },
  ],
};

export const initialSubjects: Subject[] = [
  {
    id: 'sub_math',
    code: 'MATH301',
    name: 'Mathematics III (Fourier & Vector Calculus)',
    semester: 'Semester 3',
    color: 'from-blue-600 to-indigo-700',
    icon: 'Sigma',
    instructor: 'Dr. Evelyn Vance',
    attendancePercent: 92,
    nextExamDate: '2026-08-05',
    weakAreas: ['Vector Calculus Theorems', 'Laplace Transform Inversion'],
    masteryPercent: 78,
  },
  {
    id: 'sub_phys',
    code: 'PHYS202',
    name: 'Electromagnetism & Semiconductor Physics',
    semester: 'Semester 3',
    color: 'from-amber-500 to-orange-600',
    icon: 'Zap',
    instructor: 'Prof. Marcus Brody',
    attendancePercent: 88,
    nextExamDate: '2026-08-12',
    weakAreas: ['BJT Biasing Configurations', 'Maxwell Equation Boundary Conditions'],
    masteryPercent: 70,
  },
  {
    id: 'sub_prog',
    code: 'CS201',
    name: 'Data Structures & Algorithms in C++',
    semester: 'Semester 3',
    color: 'from-emerald-500 to-teal-700',
    icon: 'Code',
    instructor: 'Dr. Sarah Connor',
    attendancePercent: 96,
    nextExamDate: '2026-08-18',
    weakAreas: ['AVL Tree Rotations', 'Dijkstra Priority Queue Optimization'],
    masteryPercent: 88,
  },
  {
    id: 'sub_digi',
    code: 'ECE204',
    name: 'Digital Logic & Microprocessor Systems',
    semester: 'Semester 3',
    color: 'from-purple-600 to-pink-600',
    icon: 'Cpu',
    instructor: 'Prof. Alan Turing',
    attendancePercent: 90,
    nextExamDate: '2026-08-22',
    weakAreas: ['K-Map Don\'t Care Conditions', 'Synchronous Counter State Machine'],
    masteryPercent: 82,
  },
];

export const initialNotes: NoteItem[] = [
  {
    id: 'n1',
    subjectId: 'sub_prog',
    title: 'Self-Balancing AVL Trees & Rotation Logic',
    content: `# AVL Trees & Balance Factors

An **AVL Tree** is a self-balancing Binary Search Tree (BST) where the height difference between left and right subtrees (Balance Factor) cannot exceed ±1.

## Balance Factor Formula
\`\`\`text
Balance Factor (BF) = Height(Left Subtree) - Height(Right Subtree)
\`\`\`
Allowed BF: \`-1, 0, +1\`

## 4 Fundamental Rotations
1. **Left-Left (LL) Case**: Single Right Rotation
2. **Right-Right (RR) Case**: Single Left Rotation
3. **Left-Right (LR) Case**: Left Rotation on Left Child, then Right Rotation on Node
4. **Right-Left (RL) Case**: Right Rotation on Right Child, then Left Rotation on Node

## C++ Code Snippet
\`\`\`cpp
int getBalanceFactor(Node* n) {
    if (!n) return 0;
    return getHeight(n->left) - getHeight(n->right);
}
\`\`\`
`,
    tags: ['C++', 'Data Structures', 'Exam Topic'],
    updatedAt: '2026-07-21',
  },
  {
    id: 'n2',
    subjectId: 'sub_math',
    title: 'Green\'s Theorem and Line Integrals',
    content: `# Green's Theorem in the Plane

Green's theorem relates a line integral around a simple closed curve $C$ to a double integral over the plane region $D$ bounded by $C$.

## Equation
$$\\oint_C (P \\, dx + Q \\, dy) = \\iint_D \\left( \\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y} \\right) dA$$

### Key Applications:
- Calculating area enclosed by parametric curves
- Computing work done by non-conservative vector fields
- Fluid circulation analysis
`,
    tags: ['Vector Calculus', 'Integrals', 'Formulas'],
    updatedAt: '2026-07-20',
  },
];

export const initialPDFs: PDFDocument[] = [
  {
    id: 'pdf_1',
    subjectId: 'sub_phys',
    title: 'Chapter_4_Semiconductor_Junctions_and_Diodes.pdf',
    fileSize: '4.2 MB',
    uploadDate: '2026-07-15',
    pageCount: 38,
    extractedText: `Chapter 4: Semiconductor Junctions, PN Diode Characteristics, and Transistor Biasing.
A PN junction is formed by joining p-type and n-type semiconductor materials. When unbiased, electrons from the n-side diffuse across the junction to combine with holes on the p-side, forming a depletion region devoid of mobile charge carriers. This creates a built-in potential barrier V_bi.
Under forward bias (V_A > 0), the potential barrier is lowered, enabling exponential current flow given by Shockley's Diode Equation:
I = I_s * (e^(V / (n * V_T)) - 1)
where V_T is the thermal voltage (~26mV at room temp), n is the ideality factor (1 to 2), and I_s is reverse saturation current.
In BJT Transistors (NPN and PNP), the three terminals are Emitter, Base, and Collector.
Collector current I_C = beta * I_B.
Biasing configurations include Fixed Bias, Emitter-Stabilized Bias, and Voltage Divider Bias.
Voltage Divider Bias is the most stable against temperature variations and beta fluctuations because the base voltage V_B is fixed by the resistor ratio R2 / (R1 + R2).`,
    summary: 'Comprehensive analysis of PN diode physics, Shockley diode equation, depletion region dynamics, and BJT biasing stabilization methods.',
    formulas: [
      'Built-in Potential: V_bi = (k*T/q) * ln(N_A * N_D / n_i^2)',
      'Shockley Equation: I = I_s * (exp(V / (n * V_T)) - 1)',
      'Thermal Voltage: V_T = k*T / q = 25.9 mV at 300K',
      'Collector Current: I_C = beta * I_B = alpha * I_E',
    ],
    keyConcepts: [
      'Depletion Region Width & Carrier Diffusion',
      'Forward vs Reverse Bias Breakdown',
      'Voltage Divider BJT Biasing Stability',
    ],
  },
  {
    id: 'pdf_2',
    subjectId: 'sub_digi',
    title: 'Unit_2_K_Maps_and_State_Machine_Design.pdf',
    fileSize: '3.1 MB',
    uploadDate: '2026-07-18',
    pageCount: 24,
    extractedText: `Unit 2: Karnaugh Maps (K-Maps) and Synchronous Sequential Logic.
K-Maps provide a pictorial method of grouping Boolean minterms to produce simplified logic expressions.
Rules for K-Map Grouping:
1. Groups must contain 2^n cells (1, 2, 4, 8, 16).
2. Groups must be rectangular and can wrap around edges.
3. Don't Care conditions ('X') can be treated as '1' or '0' depending on which yields a larger group.
Synchronous Sequential Circuits utilize a common clock signal for all flip-flops (JK, D, T).
State Machines are categorized into Mealy Machines (output depends on current state and input) and Moore Machines (output depends solely on current state).`,
    summary: 'Covers Boolean function simplification using Karnaugh maps up to 4 variables, Don\'t Care minimization, and state transition table construction for Mealy and Moore machines.',
    formulas: [
      'Minimization Rule: Group size must be 2^k',
      'Mealy Output: Y = f(State, Input)',
      'Moore Output: Y = f(State)',
    ],
    keyConcepts: [
      'K-Map Edge Wrapping & Quad/Octet Groups',
      'Mealy vs Moore Machine Architecture',
      'Synchronous Counter Flip-Flop Excitation Tables',
    ],
  },
];

export const initialFlashcards: Flashcard[] = [
  {
    id: 'fc_1',
    subjectId: 'sub_prog',
    topic: 'AVL Trees',
    front: 'What is the maximum allowed Balance Factor in an AVL Tree?',
    back: 'The balance factor must be -1, 0, or +1. If it becomes +2 or -2, a rotation is required to rebalance.',
    difficulty: 'Medium',
    lastReviewed: '2026-07-21',
    nextReviewDate: '2026-07-23',
    intervalDays: 2,
    reviewCount: 3,
    easeFactor: 2.5,
  },
  {
    id: 'fc_2',
    subjectId: 'sub_math',
    topic: 'Vector Calculus',
    front: 'State Green\'s Theorem equation relating line integral to double integral.',
    back: '∮_C (P dx + Q dy) = ∬_D (∂Q/∂x - ∂P/∂y) dA over a bounded simple closed curve C.',
    difficulty: 'Hard',
    lastReviewed: '2026-07-20',
    nextReviewDate: '2026-07-22',
    intervalDays: 1,
    reviewCount: 2,
    easeFactor: 2.36,
  },
  {
    id: 'fc_3',
    subjectId: 'sub_phys',
    topic: 'Semiconductor Physics',
    front: 'Why is Voltage Divider Biasing preferred for BJT circuits over Fixed Bias?',
    back: 'Voltage Divider Biasing makes the collector current I_C practically independent of transistor beta (β) fluctuations and thermal variations.',
    difficulty: 'Easy',
    lastReviewed: '2026-07-19',
    nextReviewDate: '2026-07-25',
    intervalDays: 6,
    reviewCount: 4,
    easeFactor: 2.6,
  },
  {
    id: 'fc_4',
    subjectId: 'sub_digi',
    topic: 'Digital Logic',
    front: 'What is the main difference between a Moore and a Mealy state machine?',
    back: 'In a Moore machine, outputs depend ONLY on the current state. In a Mealy machine, outputs depend on BOTH current state and current inputs.',
    difficulty: 'Medium',
    lastReviewed: '2026-07-18',
    nextReviewDate: '2026-07-22',
    intervalDays: 4,
    reviewCount: 3,
    easeFactor: 2.5,
  },
];

export const initialQuizzes: Quiz[] = [
  {
    id: 'q_1',
    subjectId: 'sub_prog',
    title: 'AVL Tree & BST Balancing Mastery Quiz',
    topic: 'Data Structures',
    score: 80,
    completedAt: '2026-07-20',
    questions: [
      {
        id: 'q1_1',
        type: 'mcq',
        question: 'Which rotation is performed when an insertion occurs in the right subtree of the left child of a node?',
        options: ['Left-Left (LL) Rotation', 'Right-Right (RR) Rotation', 'Left-Right (LR) Rotation', 'Right-Left (RL) Rotation'],
        correctAnswer: 'Left-Right (LR) Rotation',
        explanation: 'In LR case, the node is inserted in the right child of the left subtree. An LR double rotation performs a single left rotation on the left child followed by a right rotation on the root.',
      },
      {
        id: 'q1_2',
        type: 'true_false',
        question: 'An AVL tree always guarantees O(log N) search, insertion, and deletion time in the worst case.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Because the balance factor is strictly maintained within {-1, 0, 1}, the height of an AVL tree is strictly bounded by 1.44 log2(N).',
      },
      {
        id: 'q1_3',
        type: 'fill_blank',
        question: 'The balance factor of a node is calculated as Height(Left Subtree) minus Height(______ Subtree).',
        correctAnswer: 'Right',
        explanation: 'Balance Factor = Height(Left) - Height(Right).',
      },
    ],
  },
];

export const initialAssignments: AssignmentTask[] = [
  {
    id: 'a1',
    subjectId: 'sub_math',
    title: 'Vector Calculus Assignment 3: Green\'s & Stokes\' Theorem',
    dueDate: '2026-07-26',
    status: 'In Progress',
    priority: 'High',
    weightagePercent: 15,
  },
  {
    id: 'a2',
    subjectId: 'sub_prog',
    title: 'C++ Lab 5: Implementing AVL Tree Insertions & Rotations',
    dueDate: '2026-07-28',
    status: 'Pending',
    priority: 'High',
    weightagePercent: 10,
  },
  {
    id: 'a3',
    subjectId: 'sub_phys',
    title: 'Semiconductor Lab Report: BJT Common Emitter Characteristic Curves',
    dueDate: '2026-07-30',
    status: 'Pending',
    priority: 'Medium',
    weightagePercent: 10,
  },
];

export const initialEvents: CalendarEvent[] = [
  {
    id: 'e1',
    subjectId: 'sub_math',
    title: 'Vector Calculus Problem Solving Session',
    date: '2026-07-23',
    type: 'study_session',
    completed: false,
  },
  {
    id: 'e2',
    subjectId: 'sub_prog',
    title: 'AVL Tree Spaced Revision Due',
    date: '2026-07-23',
    type: 'revision',
    completed: false,
  },
  {
    id: 'e3',
    subjectId: 'sub_math',
    title: 'Assignment 3 Submission',
    date: '2026-07-26',
    type: 'assignment',
    completed: false,
  },
  {
    id: 'e4',
    subjectId: 'sub_math',
    title: 'Mathematics III Mid-Semester Exam',
    date: '2026-08-05',
    type: 'exam',
    completed: false,
  },
];

export const initialAnalytics: StudyAnalyticsData = {
  dailyHours: [
    { day: 'Mon', hours: 4.5, target: 4.0 },
    { day: 'Tue', hours: 5.2, target: 4.0 },
    { day: 'Wed', hours: 3.8, target: 4.0 },
    { day: 'Thu', hours: 6.0, target: 4.0 },
    { day: 'Fri', hours: 4.2, target: 4.0 },
    { day: 'Sat', hours: 7.1, target: 5.0 },
    { day: 'Sun', hours: 5.5, target: 5.0 },
  ],
  subjectMastery: [
    { subject: 'Math III', score: 78 },
    { subject: 'Physics', score: 70 },
    { subject: 'C++ DSA', score: 88 },
    { subject: 'Digital Logic', score: 82 },
  ],
  quizAccuracy: [
    { week: 'Wk 1', score: 68 },
    { week: 'Wk 2', score: 74 },
    { week: 'Wk 3', score: 82 },
    { week: 'Wk 4', score: 89 },
  ],
  forgettingCurve: [
    { day: 1, retention: 100 },
    { day: 2, retention: 82 },
    { day: 5, retention: 65 },
    { day: 10, retention: 54 },
    { day: 30, retention: 38 },
  ],
};

export const initialNotifications: NotificationItem[] = [
  {
    id: 'n_1',
    title: 'Spaced Revision Due Today',
    message: 'Time to review "Vector Calculus Green\'s Theorem" flashcards.',
    time: '10 mins ago',
    read: false,
    type: 'revision',
  },
  {
    id: 'n_2',
    title: 'Exam Countdown',
    message: 'Mathematics III Mid-Semester exam is in 14 days.',
    time: '2 hours ago',
    read: false,
    type: 'exam',
  },
  {
    id: 'n_3',
    title: 'Achievement Unlocked!',
    message: 'You earned the "14-Day Flame" streak badge (+100 XP).',
    time: '1 day ago',
    read: true,
    type: 'achievement',
  },
];

export const initialTimetableSlots: TimetableSlot[] = [
  // Monday
  { id: 'ts_mon_1', subjectId: 'sub_math', day: 'Monday', startTime: '09:00 AM', endTime: '10:00 AM', room: 'LT-101', type: 'Lecture', instructor: 'Dr. Evelyn Vance' },
  { id: 'ts_mon_2', subjectId: 'sub_prog', day: 'Monday', startTime: '10:15 AM', endTime: '11:15 AM', room: 'CS-Lab 2', type: 'Lab', instructor: 'Dr. Sarah Connor' },
  { id: 'ts_mon_3', subjectId: 'sub_phys', day: 'Monday', startTime: '11:30 AM', endTime: '12:30 PM', room: 'PHY-204', type: 'Lecture', instructor: 'Prof. Marcus Brody' },
  { id: 'ts_mon_4', subjectId: 'sub_digi', day: 'Monday', startTime: '02:00 PM', endTime: '03:00 PM', room: 'ECE-302', type: 'Lecture', instructor: 'Prof. Alan Turing' },

  // Tuesday
  { id: 'ts_tue_1', subjectId: 'sub_phys', day: 'Tuesday', startTime: '09:00 AM', endTime: '10:00 AM', room: 'PHY-204', type: 'Lecture', instructor: 'Prof. Marcus Brody' },
  { id: 'ts_tue_2', subjectId: 'sub_digi', day: 'Tuesday', startTime: '10:15 AM', endTime: '12:15 PM', room: 'Microprocessor Lab', type: 'Lab', instructor: 'Prof. Alan Turing' },
  { id: 'ts_tue_3', subjectId: 'sub_math', day: 'Tuesday', startTime: '02:00 PM', endTime: '03:00 PM', room: 'LT-101', type: 'Tutorial', instructor: 'Dr. Evelyn Vance' },

  // Wednesday
  { id: 'ts_wed_1', subjectId: 'sub_prog', day: 'Wednesday', startTime: '09:00 AM', endTime: '10:00 AM', room: 'LT-102', type: 'Lecture', instructor: 'Dr. Sarah Connor' },
  { id: 'ts_wed_2', subjectId: 'sub_math', day: 'Wednesday', startTime: '10:15 AM', endTime: '11:15 AM', room: 'LT-101', type: 'Lecture', instructor: 'Dr. Evelyn Vance' },
  { id: 'ts_wed_3', subjectId: 'sub_phys', day: 'Wednesday', startTime: '11:30 AM', endTime: '01:30 PM', room: 'Physics Lab A', type: 'Lab', instructor: 'Prof. Marcus Brody' },
  { id: 'ts_wed_4', subjectId: 'sub_digi', day: 'Wednesday', startTime: '02:30 PM', endTime: '03:30 PM', room: 'ECE-302', type: 'Lecture', instructor: 'Prof. Alan Turing' },

  // Thursday
  { id: 'ts_thu_1', subjectId: 'sub_prog', day: 'Thursday', startTime: '09:00 AM', endTime: '10:00 AM', room: 'LT-102', type: 'Lecture', instructor: 'Dr. Sarah Connor' },
  { id: 'ts_thu_2', subjectId: 'sub_digi', day: 'Thursday', startTime: '10:15 AM', endTime: '11:15 AM', room: 'ECE-302', type: 'Lecture', instructor: 'Prof. Alan Turing' },
  { id: 'ts_thu_3', subjectId: 'sub_math', day: 'Thursday', startTime: '11:30 AM', endTime: '12:30 PM', room: 'LT-101', type: 'Lecture', instructor: 'Dr. Evelyn Vance' },

  // Friday
  { id: 'ts_fri_1', subjectId: 'sub_phys', day: 'Friday', startTime: '09:00 AM', endTime: '10:00 AM', room: 'PHY-204', type: 'Lecture', instructor: 'Prof. Marcus Brody' },
  { id: 'ts_fri_2', subjectId: 'sub_prog', day: 'Friday', startTime: '10:15 AM', endTime: '12:15 PM', room: 'CS-Lab 1', type: 'Lab', instructor: 'Dr. Sarah Connor' },
  { id: 'ts_fri_3', subjectId: 'sub_math', day: 'Friday', startTime: '02:00 PM', endTime: '03:00 PM', room: 'LT-101', type: 'Seminar', instructor: 'Dr. Evelyn Vance' },
];

export const initialAttendanceLogs: AttendanceLog[] = [
  // Sample past attendance logs
  { id: 'att_1', date: '2026-07-20', slotId: 'ts_mon_1', subjectId: 'sub_math', status: 'present', timestamp: '2026-07-20T09:02:00Z' },
  { id: 'att_2', date: '2026-07-20', slotId: 'ts_mon_2', subjectId: 'sub_prog', status: 'present', timestamp: '2026-07-20T10:18:00Z' },
  { id: 'att_3', date: '2026-07-20', slotId: 'ts_mon_3', subjectId: 'sub_phys', status: 'absent', timestamp: '2026-07-20T11:35:00Z' },
  { id: 'att_4', date: '2026-07-20', slotId: 'ts_mon_4', subjectId: 'sub_digi', status: 'present', timestamp: '2026-07-20T14:01:00Z' },

  { id: 'att_5', date: '2026-07-21', slotId: 'ts_tue_1', subjectId: 'sub_phys', status: 'present', timestamp: '2026-07-21T09:00:00Z' },
  { id: 'att_6', date: '2026-07-21', slotId: 'ts_tue_2', subjectId: 'sub_digi', status: 'present', timestamp: '2026-07-21T10:15:00Z' },
  { id: 'att_7', date: '2026-07-21', slotId: 'ts_tue_3', subjectId: 'sub_math', status: 'present', timestamp: '2026-07-21T14:05:00Z' },
];

export const initialRevisionTasks: RevisionTask[] = [
  // Concept 1: AVL Trees (CS201)
  { id: 'rev_avl_d1', sourceSessionId: 'sess_avl', subjectId: 'sub_prog', subjectCode: 'CS201', subjectName: 'Data Structures & Algorithms', topic: 'Self-Balancing AVL Trees & Rotation Logic', completionDate: '2026-07-21', dayInterval: 1, scheduledDate: '2026-07-22', completed: true, completedAt: '2026-07-22T09:00:00Z' },
  { id: 'rev_avl_d2', sourceSessionId: 'sess_avl', subjectId: 'sub_prog', subjectCode: 'CS201', subjectName: 'Data Structures & Algorithms', topic: 'Self-Balancing AVL Trees & Rotation Logic', completionDate: '2026-07-21', dayInterval: 2, scheduledDate: '2026-07-23', completed: false },
  { id: 'rev_avl_d5', sourceSessionId: 'sess_avl', subjectId: 'sub_prog', subjectCode: 'CS201', subjectName: 'Data Structures & Algorithms', topic: 'Self-Balancing AVL Trees & Rotation Logic', completionDate: '2026-07-21', dayInterval: 5, scheduledDate: '2026-07-26', completed: false },
  { id: 'rev_avl_d10', sourceSessionId: 'sess_avl', subjectId: 'sub_prog', subjectCode: 'CS201', subjectName: 'Data Structures & Algorithms', topic: 'Self-Balancing AVL Trees & Rotation Logic', completionDate: '2026-07-21', dayInterval: 10, scheduledDate: '2026-07-31', completed: false },
  { id: 'rev_avl_d30', sourceSessionId: 'sess_avl', subjectId: 'sub_prog', subjectCode: 'CS201', subjectName: 'Data Structures & Algorithms', topic: 'Self-Balancing AVL Trees & Rotation Logic', completionDate: '2026-07-21', dayInterval: 30, scheduledDate: '2026-08-20', completed: false },

  // Concept 2: Green's Theorem (MATH301)
  { id: 'rev_math_d1', sourceSessionId: 'sess_math', subjectId: 'sub_math', subjectCode: 'MATH301', subjectName: 'Mathematics III', topic: 'Green\'s Theorem & Line Integrals', completionDate: '2026-07-20', dayInterval: 1, scheduledDate: '2026-07-21', completed: true, completedAt: '2026-07-21T10:00:00Z' },
  { id: 'rev_math_d2', sourceSessionId: 'sess_math', subjectId: 'sub_math', subjectCode: 'MATH301', subjectName: 'Mathematics III', topic: 'Green\'s Theorem & Line Integrals', completionDate: '2026-07-20', dayInterval: 2, scheduledDate: '2026-07-22', completed: true, completedAt: '2026-07-22T08:30:00Z' },
  { id: 'rev_math_d5', sourceSessionId: 'sess_math', subjectId: 'sub_math', subjectCode: 'MATH301', subjectName: 'Mathematics III', topic: 'Green\'s Theorem & Line Integrals', completionDate: '2026-07-20', dayInterval: 5, scheduledDate: '2026-07-25', completed: false },
  { id: 'rev_math_d10', sourceSessionId: 'sess_math', subjectId: 'sub_math', subjectCode: 'MATH301', subjectName: 'Mathematics III', topic: 'Green\'s Theorem & Line Integrals', completionDate: '2026-07-20', dayInterval: 10, scheduledDate: '2026-07-30', completed: false },
  { id: 'rev_math_d30', sourceSessionId: 'sess_math', subjectId: 'sub_math', subjectCode: 'MATH301', subjectName: 'Mathematics III', topic: 'Green\'s Theorem & Line Integrals', completionDate: '2026-07-20', dayInterval: 30, scheduledDate: '2026-08-19', completed: false },

  // Concept 3: BJT Biasing (PHYS202)
  { id: 'rev_phys_d1', sourceSessionId: 'sess_phys', subjectId: 'sub_phys', subjectCode: 'PHYS202', subjectName: 'Electromagnetism & Physics', topic: 'BJT Voltage Divider Biasing Stabilization', completionDate: '2026-07-22', dayInterval: 1, scheduledDate: '2026-07-23', completed: false },
  { id: 'rev_phys_d2', sourceSessionId: 'sess_phys', subjectId: 'sub_phys', subjectCode: 'PHYS202', subjectName: 'Electromagnetism & Physics', topic: 'BJT Voltage Divider Biasing Stabilization', completionDate: '2026-07-22', dayInterval: 2, scheduledDate: '2026-07-24', completed: false },
  { id: 'rev_phys_d5', sourceSessionId: 'sess_phys', subjectId: 'sub_phys', subjectCode: 'PHYS202', subjectName: 'Electromagnetism & Physics', topic: 'BJT Voltage Divider Biasing Stabilization', completionDate: '2026-07-22', dayInterval: 5, scheduledDate: '2026-07-27', completed: false },
  { id: 'rev_phys_d10', sourceSessionId: 'sess_phys', subjectId: 'sub_phys', subjectCode: 'PHYS202', subjectName: 'Electromagnetism & Physics', topic: 'BJT Voltage Divider Biasing Stabilization', completionDate: '2026-07-22', dayInterval: 10, scheduledDate: '2026-08-01', completed: false },
  { id: 'rev_phys_d30', sourceSessionId: 'sess_phys', subjectId: 'sub_phys', subjectCode: 'PHYS202', subjectName: 'Electromagnetism & Physics', topic: 'BJT Voltage Divider Biasing Stabilization', completionDate: '2026-07-22', dayInterval: 30, scheduledDate: '2026-08-21', completed: false },
];

