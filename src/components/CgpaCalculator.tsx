import React, { useState, useEffect } from 'react';
import { Calculator, Award, TrendingUp, Sparkles, Plus, Trash2, CheckCircle2, ShieldAlert, Target, BookOpen, Save } from 'lucide-react';
import { UserProfile } from '../types';
import { saveUserCgpaRecord, updateUserProfileDoc } from '../lib/firebase';

interface CgpaCalculatorProps {
  user?: UserProfile;
  onUpdateUser?: (updatedUser: Partial<UserProfile>) => void;
  authUid?: string | null;
  initialTargetCgpa?: number;
}

interface CourseGradeItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  gradePoint: number; // 0 to 10
}

interface PastSemesterItem {
  id: string;
  semesterName: string;
  sgpa: number;
  totalCredits: number;
}

const GRADE_MAP: { letter: string; points: number; desc: string }[] = [
  { letter: 'O / S', points: 10, desc: 'Outstanding' },
  { letter: 'A+', points: 9, desc: 'Excellent' },
  { letter: 'A', points: 8, desc: 'Very Good' },
  { letter: 'B+', points: 7, desc: 'Good' },
  { letter: 'B', points: 6, desc: 'Above Average' },
  { letter: 'C', points: 5, desc: 'Average' },
  { letter: 'P / D', points: 4, desc: 'Pass' },
  { letter: 'F', points: 0, desc: 'Fail' },
];

export const CgpaCalculator: React.FC<CgpaCalculatorProps> = ({ 
  user, 
  onUpdateUser, 
  authUid, 
  initialTargetCgpa 
}) => {
  // Current Semester Course Grades
  const [courses, setCourses] = useState<CourseGradeItem[]>([
    { id: 'c1', code: 'CS301', name: 'Data Structures & Algorithms', credits: 4, gradePoint: 9 },
    { id: 'c2', code: 'CS302', name: 'Operating Systems Architecture', credits: 4, gradePoint: 8 },
    { id: 'c3', code: 'MA301', name: 'Applied Mathematics & Linear Algebra', credits: 4, gradePoint: 8 },
    { id: 'c4', code: 'EE301', name: 'Analog Electronic Circuits', credits: 3, gradePoint: 7 },
    { id: 'c5', code: 'CS305P', name: 'Data Structures Lab', credits: 2, gradePoint: 10 },
  ]);

  // Past Semesters
  const [pastSemesters, setPastSemesters] = useState<PastSemesterItem[]>([
    { id: 'sem1', semesterName: 'Semester 1', sgpa: 7.4, totalCredits: 20 },
    { id: 'sem2', semesterName: 'Semester 2', sgpa: 7.8, totalCredits: 22 },
  ]);

  const [targetCgpa, setTargetCgpa] = useState<number>(initialTargetCgpa || user?.targetGpa || 8.8);
  const [totalDegreeSemesters, setTotalDegreeSemesters] = useState<number>(8);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // New course inputs
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState<number>(3);
  const [newGrade, setNewGrade] = useState<number>(9);

  // New past semester inputs
  const [newPastSemName, setNewPastSemName] = useState('');
  const [newPastSgpa, setNewPastSgpa] = useState<number>(8.0);

  // Calculate SGPA for current semester
  const totalCurrentCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  const currentTotalGradePoints = courses.reduce((acc, c) => acc + (c.credits * c.gradePoint), 0);
  const currentSgpa = totalCurrentCredits > 0 ? Number((currentTotalGradePoints / totalCurrentCredits).toFixed(2)) : 0;

  // Calculate Overall CGPA (Past + Current)
  const pastSemCredits = pastSemesters.reduce((acc, s) => acc + s.totalCredits, 0);
  const pastSemGradePoints = pastSemesters.reduce((acc, s) => acc + (s.totalCredits * s.sgpa), 0);

  const overallCredits = pastSemCredits + totalCurrentCredits;
  const overallGradePoints = pastSemGradePoints + currentTotalGradePoints;
  const overallCgpa = overallCredits > 0 ? Number((overallGradePoints / overallCredits).toFixed(2)) : currentSgpa;

  // Calculate Required Future SGPA
  const completedSemCount = pastSemesters.length + 1;
  const remainingSems = Math.max(1, totalDegreeSemesters - completedSemCount);
  
  const targetTotalPointsNeeded = targetCgpa * totalDegreeSemesters;
  const currentAccumulatedPoints = (overallCgpa * completedSemCount);
  const remainingPointsNeeded = targetTotalPointsNeeded - currentAccumulatedPoints;
  const requiredAvgFutureSgpa = Number((remainingPointsNeeded / remainingSems).toFixed(2));

  // Determine Rigor Level
  const cgpaGap = targetCgpa - overallCgpa;
  let rigorLevel: 'maintenance' | 'target_push' | 'high_rigor' = 'maintenance';
  let recommendedDailyHours = 2.0;
  let rigorBadgeText = 'Maintenance Mode';
  let rigorDesc = 'Your target is within comfortable range. Maintain current study routine.';

  if (cgpaGap > 0.8) {
    rigorLevel = 'high_rigor';
    recommendedDailyHours = 4.5;
    rigorBadgeText = '🔥 High Rigor / Comeback Mode';
    rigorDesc = `Targeting +${cgpaGap.toFixed(1)} CGPA boost. Requires intensive Feynman AI tutoring, daily active recall, and 4.5 hrs/day dedicated study.`;
  } else if (cgpaGap > 0.2) {
    rigorLevel = 'target_push';
    recommendedDailyHours = 3.5;
    rigorBadgeText = '📈 Target Push Mode';
    rigorDesc = `Pushing for a +${cgpaGap.toFixed(1)} CGPA increase. Focused practice on weak areas and 3.5 hrs/day required.`;
  }

  const handleAddCourse = () => {
    if (!newName.trim()) return;
    setCourses([...courses, {
      id: Date.now().toString(),
      code: newCode.toUpperCase() || 'SUB101',
      name: newName,
      credits: newCredits,
      gradePoint: newGrade,
    }]);
    setNewCode('');
    setNewName('');
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const handleAddPastSem = () => {
    if (!newPastSemName.trim()) return;
    setPastSemesters([...pastSemesters, {
      id: Date.now().toString(),
      semesterName: newPastSemName,
      sgpa: newPastSgpa,
      totalCredits: 20,
    }]);
    setNewPastSemName('');
  };

  const handleSaveSyncProfile = async () => {
    if (onUpdateUser) {
      onUpdateUser({
        targetGpa: targetCgpa,
      });
    }

    if (authUid) {
      await saveUserCgpaRecord(authUid, {
        currentSgpa,
        overallCgpa,
        targetCgpa,
        rigorLevel,
        recommendedDailyHours,
        courses,
        pastSemesters,
      });
      await updateUserProfileDoc(authUid, {
        targetGpa: targetCgpa,
        currentCgpa: overallCgpa,
        targetCgpa: targetCgpa,
        rigorLevel: rigorLevel,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#1A1A1A]">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#F6F4F0] p-6 rounded-3xl border border-[#EAE7E0] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-[#FBFBF9]">
              Standard 10.0 Grading Scale
            </span>
            <span className="text-xs text-zinc-500 font-mono">UGC / University Grade System</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            CGPA Tracker & Academic Rigor Engine
          </h1>
          <p className="text-zinc-600 text-xs sm:text-sm mt-1">
            Calculate your SGPA & cumulative CGPA, set your target goal, and automatically tune your AI study plan workload.
          </p>
        </div>

        <button
          onClick={handleSaveSyncProfile}
          className="px-5 py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
          id="sync-cgpa-profile-btn"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CGPA & Rigor Synced!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-[#A68942]" />
              <span>Sync CGPA with AI Tutor</span>
            </>
          )}
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Current Semester SGPA</span>
            <Calculator className="w-4 h-4 text-[#A68942]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#1A1A1A]">{currentSgpa.toFixed(2)}</p>
          <p className="text-[11px] text-zinc-500 mt-1">
            From {totalCurrentCredits} credits this semester
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Overall CGPA (Cumulative)</span>
            <Award className="w-4 h-4 text-[#A68942]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#1A1A1A]">{overallCgpa.toFixed(2)}</p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Across {completedSemCount} semesters ({overallCredits} credits)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Target CGPA Goal</span>
            <Target className="w-4 h-4 text-[#A68942]" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="10.0"
              value={targetCgpa}
              onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 8.0)}
              className="w-24 font-serif text-2xl font-bold text-[#1A1A1A] bg-[#F6F4F0] border border-[#EAE7E0] rounded-xl px-2 py-0.5 focus:outline-none focus:border-[#A68942]"
            />
            <span className="text-xs text-zinc-400">/ 10.0</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Required avg in remaining sems: <strong className="text-[#A68942] font-semibold">{requiredAvgFutureSgpa > 10 ? 'Max Effort' : requiredAvgFutureSgpa.toFixed(2)}</strong>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#F6F4F0] border border-[#A68942]/30 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#A68942] uppercase tracking-wider font-mono">Adaptive AI Rigor</span>
            <Sparkles className="w-4 h-4 text-[#A68942]" />
          </div>
          <p className="font-serif font-bold text-sm text-[#1A1A1A]">{rigorBadgeText}</p>
          <p className="text-[11px] text-zinc-600 mt-1 leading-snug">
            {recommendedDailyHours} hrs/day recommended
          </p>
        </div>
      </div>

      {/* 10-Point University Grading Table Reference */}
      <div className="p-5 rounded-3xl bg-[#F6F4F0] border border-[#EAE7E0] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#A68942]" />
            <span>10-Point Grading Scale Reference Guide</span>
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
          {GRADE_MAP.map((g) => (
            <div key={g.letter} className="p-2.5 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-center">
              <span className="font-bold text-[#A68942] block text-sm">{g.letter}</span>
              <span className="font-mono text-xs text-[#1A1A1A] font-semibold">{g.points} Points</span>
              <span className="text-[10px] text-zinc-500 block truncate">{g.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Current Semester Calculator & Past Semesters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Current Semester Course List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">
                  Current Semester Subjects ({user?.semester || 'Semester 3'})
                </h2>
                <p className="text-xs text-zinc-500">Enter credits and target/achieved grade points for SGPA calculation</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F6F4F0] border border-[#EAE7E0] text-xs font-mono font-bold text-[#A68942]">
                SGPA: {currentSgpa.toFixed(2)}
              </span>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#EAE7E0]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#F6F4F0] text-zinc-700 font-serif font-bold border-b border-[#EAE7E0]">
                  <tr>
                    <th className="p-3">Course Code</th>
                    <th className="p-3">Course Title</th>
                    <th className="p-3 text-center">Credits</th>
                    <th className="p-3 text-center">Grade Point</th>
                    <th className="p-3 text-center">Total Points</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE7E0]">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F6F4F0]/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#A68942]">{c.code}</td>
                      <td className="p-3 font-medium text-[#1A1A1A]">{c.name}</td>
                      <td className="p-3 text-center font-mono">
                        <select
                          value={c.credits}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setCourses(courses.map(x => x.id === c.id ? { ...x, credits: val } : x));
                          }}
                          className="bg-[#F6F4F0] border border-[#EAE7E0] rounded-lg px-2 py-1 focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6].map(num => (
                            <option key={num} value={num}>{num} Credits</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={c.gradePoint}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setCourses(courses.map(x => x.id === c.id ? { ...x, gradePoint: val } : x));
                          }}
                          className="bg-[#F6F4F0] border border-[#EAE7E0] rounded-lg px-2 py-1 font-semibold text-[#1A1A1A] focus:outline-none"
                        >
                          {GRADE_MAP.map(g => (
                            <option key={g.points} value={g.points}>{g.letter} ({g.points} pts)</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#1A1A1A]">
                        {c.credits * c.gradePoint}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteCourse(c.id)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Course Form Inline */}
            <div className="p-4 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] space-y-3">
              <p className="text-xs font-bold text-zinc-700">Add New Subject / Lab to Semester</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Code (e.g. CS303)"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-[#1A1A1A]"
                />
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-[#1A1A1A]"
                />
                <button
                  onClick={handleAddCourse}
                  className="px-4 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4 text-[#A68942]" />
                  <span>Add</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Col: Past Semesters & Cumulative Goal Analysis */}
        <div className="space-y-6">
          
          {/* Past Semesters History */}
          <div className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs space-y-4">
            <h2 className="font-serif text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#A68942]" />
              <span>Past Semesters History</span>
            </h2>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pastSemesters.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#1A1A1A]">{s.semesterName}</p>
                    <p className="text-[10px] text-zinc-500">{s.totalCredits} Credits completed</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#A68942]">SGPA {s.sgpa.toFixed(2)}</span>
                    <button
                      onClick={() => setPastSemesters(pastSemesters.filter(x => x.id !== s.id))}
                      className="text-zinc-400 hover:text-rose-500"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Past Sem Inline */}
            <div className="pt-2 border-t border-[#EAE7E0] space-y-2">
              <p className="text-[11px] font-semibold text-zinc-600">Add Previous Semester Result</p>
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Sem Name (Sem 1)"
                  value={newPastSemName}
                  onChange={(e) => setNewPastSemName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6F4F0] border border-[#EAE7E0]"
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="SGPA"
                  value={newPastSgpa}
                  onChange={(e) => setNewPastSgpa(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-[#F6F4F0] border border-[#EAE7E0] font-mono"
                />
                <button
                  onClick={handleAddPastSem}
                  className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-[#FBFBF9] font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* AI Workload Adjustment Card */}
          <div className="p-6 rounded-3xl bg-[#F6F4F0] border border-[#EAE7E0] space-y-3">
            <div className="flex items-center gap-2 text-[#A68942]">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">AI Rigor & Workload Impact</h3>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {rigorDesc}
            </p>
            <div className="p-3 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Target Gap:</span>
                <span className="font-bold text-[#1A1A1A]">+{cgpaGap.toFixed(2)} CGPA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Suggested Daily Study:</span>
                <span className="font-bold text-[#A68942]">{recommendedDailyHours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Feynman Practice:</span>
                <span className="font-bold text-emerald-700">Enabled</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
