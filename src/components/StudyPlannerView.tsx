import React, { useState, useRef } from 'react';
import { 
  FileText, Upload, Sparkles, Calendar, CheckSquare, Square, Clock, AlertCircle, 
  ArrowRight, BookOpen, Target, Award, Brain, RefreshCw, CheckCircle2, BookmarkPlus
} from 'lucide-react';
import { UserProfile, Subject } from '../types';
import { saveUserStudyPlan } from '../lib/firebase';

interface StudyPlannerViewProps {
  user: UserProfile;
  subjects: Subject[];
  authUid?: string | null;
  onStudySessionCompleted?: (session: {
    sourceSessionId: string;
    topic: string;
    subjectId: string;
    subjectCode: string;
    subjectName?: string;
    completed: boolean;
    completionDate?: string;
  }) => void;
}

export interface DailyTaskUnit {
  dayNumber: number;
  dayTitle: string;
  coreTopic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedMinutes: number;
  keyTasks: string[];
  feynmanPrompt: string;
  highYieldExamTip?: string;
  completed?: boolean;
}

export interface GeneratedStudyPlan {
  planTitle: string;
  summary: string;
  rigorLevel?: string;
  totalRecommendedHours?: number;
  dailySchedule: DailyTaskUnit[];
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({ 
  user, 
  subjects, 
  authUid,
  onStudySessionCompleted 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.name || 'Data Structures');
  const [daysCount, setDaysCount] = useState<number>(7);
  const [dailyHours, setDailyHours] = useState<number>(3.5);
  const [completionNotification, setCompletionNotification] = useState<string | null>(null);
  
  // File upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [parsedDocName, setParsedDocName] = useState<string | null>(null);
  const [parsedDocText, setParsedDocText] = useState<string>('');
  const [parsedPages, setParsedPages] = useState<number>(1);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // AI Plan Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [studyPlan, setStudyPlan] = useState<GeneratedStudyPlan | null>(null);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);

  // File Upload Handler
  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to parse document text');
      }

      const data = await res.json();
      setParsedDocName(data.fileName || file.name);
      setParsedDocText(data.extractedText || '');
      setParsedPages(data.pageCount || 1);

      // Auto-trigger study plan generation
      await generatePlanForDocument(data.fileName || file.name, data.extractedText || '');
    } catch (err: any) {
      console.error('Document upload error:', err);
      setUploadError(err?.message || 'Failed to parse file. Please try another PDF or PPTX document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Generate Study Plan via AI
  const generatePlanForDocument = async (docTitle?: string, docContent?: string) => {
    setIsGenerating(true);
    setSavedPlanId(null);

    try {
      const res = await fetch('/api/ai/study-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentName: docTitle || parsedDocName || 'Course Notes',
          documentText: docContent || parsedDocText,
          subject: selectedSubject,
          currentCgpa: user.targetGpa ? user.targetGpa - 0.8 : 7.8,
          targetCgpa: user.targetGpa || 9.0,
          daysCount,
          dailyHours,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate study schedule');
      }

      const planData: GeneratedStudyPlan = await res.json();
      setStudyPlan(planData);

      // Save to Firebase Firestore if logged in
      if (authUid) {
        const savedId = await saveUserStudyPlan(authUid, {
          subject: selectedSubject,
          documentName: docTitle || parsedDocName || 'Course Material',
          daysCount,
          dailyHours,
          planTitle: planData.planTitle,
          dailySchedule: planData.dailySchedule,
          targetCgpa: user.targetGpa || 9.0,
        });
        setSavedPlanId(savedId);
      }
    } catch (err: any) {
      console.error('Error generating plan:', err);
      setUploadError('Failed to generate AI study plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskCompleted = (dayIndex: number, taskIndex: number) => {
    if (!studyPlan) return;
    const updatedSchedule = [...studyPlan.dailySchedule];
    const unit = updatedSchedule[dayIndex];
    if (!unit) return;

    // Toggle completed state on unit or task
    const nextCompletedState = !unit.completed;
    unit.completed = nextCompletedState;
    setStudyPlan({ ...studyPlan, dailySchedule: updatedSchedule });

    // Find matching subject or default
    const matchingSubj = subjects.find(s => s.name === selectedSubject || s.code === selectedSubject) || subjects[0];
    const sourceSessionId = `plan_${savedPlanId || 'plan'}_d${unit.dayNumber}_${unit.coreTopic.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;

    // Trigger parent integration callback
    if (onStudySessionCompleted) {
      onStudySessionCompleted({
        sourceSessionId,
        topic: unit.coreTopic,
        subjectId: matchingSubj?.id || 'sub_prog',
        subjectCode: matchingSubj?.code || 'CS201',
        subjectName: matchingSubj?.name || 'Computer Science',
        completed: nextCompletedState,
        completionDate: new Date().toISOString().split('T')[0],
      });
    }

    if (nextCompletedState) {
      setCompletionNotification(
        `✓ Session completed! 5-stage Forgetting Curve revision tasks auto-scheduled for "${unit.coreTopic}" (Day 1, 2, 5, 10, 30)`
      );
      setTimeout(() => setCompletionNotification(null), 7000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#1A1A1A]">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#F6F4F0] p-6 rounded-3xl border border-[#EAE7E0] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-[#FBFBF9]">
              Automated AI Study Engine
            </span>
            <span className="text-xs text-zinc-500 font-mono">PDF / PPT Document Powered</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Automated AI Study Planner
          </h1>
          <p className="text-zinc-600 text-xs sm:text-sm mt-1">
            Upload your lecture slides or textbook PDF, and SemOS will construct a day-by-day study timeline tailored to your target CGPA.
          </p>
        </div>

        {savedPlanId && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Saved to Firebase User Account</span>
          </div>
        )}
      </div>

      {completionNotification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{completionNotification}</span>
          </div>
          <button 
            onClick={() => setCompletionNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Upload & Parameters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Document Drag & Drop + Controls */}
        <div className="space-y-6">
          
          {/* File Drag and Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="p-8 rounded-3xl border-2 border-dashed border-[#A68942]/40 bg-[#FBFBF9] hover:bg-[#F6F4F0] transition-all cursor-pointer text-center space-y-3 shadow-xs group"
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              accept=".pdf,.ppt,.pptx,.txt"
              className="hidden"
            />
            
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1A1A1A] text-[#A68942] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
              {isUploading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-[#A68942]" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="font-serif font-bold text-sm text-[#1A1A1A]">
                {isUploading ? 'Extracting Text & Slides...' : 'Drop Lecture Slides or Textbooks Here'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Supports <strong className="text-[#A68942]">.PDF, .PPT, .PPTX</strong> & text files
              </p>
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-[#F6F4F0] border border-[#EAE7E0] text-[11px] font-medium text-zinc-600">
              Browse Files from System
            </span>
          </div>

          {/* Uploaded File Info Card */}
          {parsedDocName && (
            <div className="p-4 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#A68942]" />
                <div>
                  <p className="font-bold text-[#1A1A1A] truncate max-w-[200px]">{parsedDocName}</p>
                  <p className="text-[11px] text-zinc-500">{parsedPages} Pages/Slides Extracted</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Text Ready
              </span>
            </div>
          )}

          {uploadError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Schedule Parameters Panel */}
          <div className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#A68942]" />
              <span>Planner Parameters</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-600 font-medium mb-1">Target Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.code} – {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Horizon (Days)</label>
                  <select
                    value={daysCount}
                    onChange={(e) => setDaysCount(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A]"
                  >
                    <option value={3}>3 Days (Crash)</option>
                    <option value={7}>7 Days (1 Week)</option>
                    <option value={14}>14 Days (2 Weeks)</option>
                    <option value={21}>21 Days (3 Weeks)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Daily Study Time</label>
                  <select
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A]"
                  >
                    <option value={2.0}>2.0 Hours/Day</option>
                    <option value={3.5}>3.5 Hours/Day</option>
                    <option value={4.5}>4.5 Hours/Day</option>
                    <option value={6.0}>6.0 Hours/Day</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] flex items-center justify-between">
                <span className="text-zinc-600 font-medium">Target CGPA Scale:</span>
                <span className="font-serif font-bold text-[#A68942]">{user.targetGpa || 9.0} / 10.0</span>
              </div>

              <button
                onClick={() => generatePlanForDocument()}
                disabled={isGenerating}
                className="w-full py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold transition-all shadow-md flex items-center justify-center gap-2"
                id="generate-ai-study-plan-btn"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#A68942]" />
                    <span>Analyzing Document & Schedule...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#A68942]" />
                    <span>Generate AI Study Schedule</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Right 2 Cols: Interactive Generated AI Study Schedule */}
        <div className="lg:col-span-2 space-y-6">
          
          {studyPlan ? (
            <div className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs space-y-6">
              
              {/* Plan Title & Executive Summary */}
              <div className="p-5 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#A68942] uppercase tracking-wider">
                    {studyPlan.rigorLevel || 'Custom AI Schedule'}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {daysCount} Days • {dailyHours} hrs/day
                  </span>
                </div>
                <h2 className="font-serif text-xl font-bold text-[#1A1A1A]">
                  {studyPlan.planTitle}
                </h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {studyPlan.summary}
                </p>
              </div>

              {/* Day-by-Day Timeline List */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#A68942]" />
                  <span>Actionable Day-by-Day Timeline</span>
                </h3>

                <div className="space-y-3">
                  {studyPlan.dailySchedule.map((unit, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-2xl border transition-all ${
                        unit.completed 
                          ? 'bg-emerald-50/50 border-emerald-200 opacity-75' 
                          : 'bg-[#FBFBF9] border-[#EAE7E0] hover:border-[#A68942]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTaskCompleted(idx, 0)}
                            className="text-zinc-500 hover:text-[#A68942] transition-colors shrink-0"
                            title="Toggle day completed"
                          >
                            {unit.completed ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Square className="w-5 h-5 text-zinc-400" />
                            )}
                          </button>

                          <span className="px-2.5 py-0.5 rounded-lg bg-[#1A1A1A] text-[#FBFBF9] font-mono text-xs font-bold">
                            Day {unit.dayNumber}
                          </span>

                          <h4 className={`font-serif font-bold text-sm text-[#1A1A1A] ${unit.completed ? 'line-through text-zinc-500' : ''}`}>
                            {unit.dayTitle}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            unit.difficulty === 'Hard' ? 'bg-rose-100 text-rose-800' :
                            unit.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {unit.difficulty}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {unit.estimatedMinutes} mins
                          </span>
                        </div>
                      </div>

                      {/* Topic & Tasks */}
                      <p className="text-xs font-semibold text-[#A68942] mb-2 pl-7 font-mono">
                        Topic: {unit.coreTopic}
                      </p>

                      <ul className="pl-7 space-y-1 text-xs text-zinc-700 list-disc list-inside mb-3">
                        {unit.keyTasks.map((task, tIdx) => (
                          <li key={tIdx} className="leading-relaxed">{task}</li>
                        ))}
                      </ul>

                      {/* Feynman Check & Exam Tip Callout */}
                      <div className="ml-7 p-3 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[#1A1A1A]">
                          <Brain className="w-3.5 h-3.5 text-[#A68942]" />
                          <span>Feynman Concept Check:</span>
                        </div>
                        <p className="text-zinc-600 text-[11px] italic">"{unit.feynmanPrompt}"</p>

                        {unit.highYieldExamTip && (
                          <p className="text-[11px] text-[#A68942] font-semibold pt-1 border-t border-[#EAE7E0] mt-1">
                            💡 High-Yield Tip: {unit.highYieldExamTip}
                          </p>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#A68942] flex items-center justify-center">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                No Study Schedule Generated Yet
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                Upload your course PDF or presentation slides on the left, or select a subject and click <strong>"Generate AI Study Schedule"</strong> to build your personalized study timeline.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
