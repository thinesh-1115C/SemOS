import React, { useState, useRef } from 'react';
import { Subject, Quiz, QuizQuestion, Flashcard, PDFDocument } from '../types';
import { FileLibraryModal } from './FileLibraryModal';
import { 
  HelpCircle, Sparkles, CheckCircle2, XCircle, Clock, 
  Award, ArrowRight, RefreshCw, Layers, Plus,
  Upload, FileText, X, FolderOpen, Loader2
} from 'lucide-react';

interface QuizViewProps {
  subjects: Subject[];
  quizzes: Quiz[];
  pdfs?: PDFDocument[];
  onAddPdf?: (pdf: Omit<PDFDocument, 'id' | 'uploadDate'>) => PDFDocument | void;
  onDeletePdf?: (pdfId: string) => void;
  onSaveQuizResult: (quiz: Quiz) => void;
  onAddFlashcard: (card: Omit<Flashcard, 'id' | 'nextReviewDate' | 'intervalDays' | 'reviewCount' | 'easeFactor'>) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  subjects,
  quizzes,
  pdfs = [],
  onAddPdf,
  onDeletePdf,
  onSaveQuizResult,
  onAddFlashcard,
}) => {
  // Generator options
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || 'custom');
  const [customSubjectCode, setCustomSubjectCode] = useState('');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Attached File State for Quiz Generator
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileText, setAttachedFileText] = useState<string>('');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active quiz session
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [convertedFlashcards, setConvertedFlashcards] = useState<Record<string, boolean>>({});

  const handleFileUpload = async (file: File) => {
    setIsParsingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      let extractedText = '';
      if (res.ok) {
        const data = await res.json();
        extractedText = data.extractedText || '';
      } else {
        extractedText = await file.text();
      }

      setAttachedFileName(file.name);
      setAttachedFileText(extractedText);

      if (onAddPdf) {
        onAddPdf({
          subjectId: selectedSubjectId !== 'custom' ? selectedSubjectId : 'general',
          title: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          pageCount: 1,
          extractedText,
        });
      }
    } catch {
      try {
        const text = await file.text();
        setAttachedFileName(file.name);
        setAttachedFileText(text);
      } catch (err) {
        console.error('File read error:', err);
      }
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const subjectObj = subjects.find(s => s.id === selectedSubjectId);
      const subjectDisplayName = selectedSubjectId === 'custom'
        ? `${customSubjectCode || 'GEN'} ${customSubjectName || 'General Subject'}`
        : subjectObj?.name || 'General Computer Science';

      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectDisplayName,
          topic,
          sourceText: attachedFileText || undefined,
          questionCount,
        }),
      });

      const data = await res.json();
      if (data.questions && Array.isArray(data.questions)) {
        const newQuiz: Quiz = {
          id: Date.now().toString(),
          subjectId: selectedSubjectId !== 'custom' ? selectedSubjectId : 'general',
          title: data.quizTitle || `${topic} Mastery Quiz`,
          topic,
          questions: data.questions,
        };
        setActiveQuiz(newQuiz);
        setUserAnswers({});
        setQuizSubmitted(false);
        setConvertedFlashcards({});
      }
    } catch (err) {
      console.error('Failed to generate quiz:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (qId: string, answer: string) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    setQuizSubmitted(true);

    let correctCount = 0;
    activeQuiz.questions.forEach((q) => {
      const userAns = (userAnswers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();
      if (userAns === correctAns || userAns.includes(correctAns)) {
        correctCount += 1;
      }
    });

    const calculatedScore = Math.round((correctCount / activeQuiz.questions.length) * 100);
    const completedQuiz: Quiz = {
      ...activeQuiz,
      score: calculatedScore,
      completedAt: new Date().toISOString().split('T')[0],
    };

    onSaveQuizResult(completedQuiz);
  };

  const handleConvertToFlashcard = (q: QuizQuestion) => {
    if (!activeQuiz) return;
    onAddFlashcard({
      subjectId: activeQuiz.subjectId,
      topic: activeQuiz.topic,
      front: q.question,
      back: `Correct Answer: ${q.correctAnswer}\n\nExplanation: ${q.explanation}`,
      difficulty: 'Hard',
    });
    setConvertedFlashcards(prev => ({ ...prev, [q.id]: true }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Smart Quiz Generator & Assessment</h1>
            <p className="text-xs text-slate-400">Generate exam-style MCQs, True/False, and numerical questions</p>
          </div>
        </div>
      </div>

      {/* Quiz Generator Form */}
      {!activeQuiz && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Generate New Assessment Quiz from Notes or File</span>
            </h2>
            <span className="text-[11px] text-purple-400 font-mono font-bold bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              AI Quiz Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Select / Type Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.code} - {(s?.name || '').split('(')[0]}</option>
                ))}
                <option value="custom">+ Type Custom Subject & Code</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Topic / Unit Name</label>
              <input
                type="text"
                placeholder="e.g. Vector Calculus Green's Theorem"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Number of Questions</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>
          </div>

          {selectedSubjectId === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Custom Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g. ECE401, MATH301"
                  value={customSubjectCode}
                  onChange={(e) => setCustomSubjectCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Custom Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Microprocessors & Interfacing"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* File Upload / Attachment Area */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 block">
              Attach Source Document / PDF (Optional)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.ppt,.pptx,.txt,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />

            {attachedFileName ? (
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs text-purple-200">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold truncate">{attachedFileName}</p>
                    <p className="text-[10px] text-purple-300/70 font-mono">
                      {attachedFileText ? `${attachedFileText.length} characters extracted` : 'Document loaded'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAttachedFileName(null);
                    setAttachedFileText('');
                  }}
                  className="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors shrink-0"
                  title="Remove Attached File"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsingFile}
                  className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-purple-500/50 flex items-center justify-center gap-2 text-xs text-slate-300 transition-all group"
                >
                  {isParsingFile ? (
                    <>
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                      <span>Reading Document...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span>Upload File from Device (.pdf, .txt)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLibraryModalOpen(true)}
                  className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 flex items-center justify-center gap-2 text-xs text-slate-300 transition-all group"
                >
                  <FolderOpen className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Pick from Inbuilt Library ({pdfs.length})</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateQuiz}
            disabled={isGenerating || !topic.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating {questionCount} Quiz Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate {questionCount}-Question AI Quiz</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* File Library Modal for Picking PDFs */}
      <FileLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        pdfs={pdfs}
        subjects={subjects}
        onSelectPdf={(pdf) => {
          setAttachedFileName(pdf.title);
          setAttachedFileText(pdf.extractedText || '');
          setIsLibraryModalOpen(false);
        }}
        onAddPdf={onAddPdf || (() => {})}
        onDeletePdf={onDeletePdf}
        title="Select File for Quiz Generator"
        subtitle="Choose a document from your library to generate tailored MCQs and short-answer questions"
      />

      {/* Active Quiz Player */}
      {activeQuiz && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="font-bold text-base text-white">{activeQuiz.title}</h2>
              <p className="text-xs text-slate-400">{activeQuiz.questions.length} Questions • Topic: {activeQuiz.topic}</p>
            </div>

            <button
              onClick={() => setActiveQuiz(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Exit Quiz
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {activeQuiz.questions.map((q, idx) => {
              const userAns = userAnswers[q.id];
              const isCorrect = quizSubmitted && (userAns || '').trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();

              return (
                <div key={q.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-xs text-indigo-400 font-mono">Q{idx + 1}.</span>
                    <h3 className="font-bold text-sm text-slate-100 flex-1">{q.question}</h3>
                    {quizSubmitted && (
                      isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )
                    )}
                  </div>

                  {/* MCQ Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = userAns === opt;
                        let btnStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700';

                        if (isSelected) {
                          btnStyle = 'bg-indigo-600 text-white font-bold border-indigo-500';
                        }
                        if (quizSubmitted) {
                          if (opt === q.correctAnswer) {
                            btnStyle = 'bg-emerald-600 text-white font-bold border-emerald-500';
                          } else if (isSelected && !isCorrect) {
                            btnStyle = 'bg-rose-600 text-white font-bold border-rose-500';
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectAnswer(q.id, opt)}
                            className={`p-3 rounded-xl border text-left text-xs transition-all ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill in blank / Short answer input */}
                  {(!q.options || q.options.length === 0) && (
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={userAns || ''}
                      onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                      disabled={quizSubmitted}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                    />
                  )}

                  {/* Explanation after submit */}
                  {quizSubmitted && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs space-y-2 mt-3">
                      <p className="font-semibold text-indigo-300">
                        Correct Answer: <span className="text-white font-mono">{q.correctAnswer}</span>
                      </p>
                      <p className="text-slate-300 leading-relaxed">{q.explanation}</p>

                      {!isCorrect && (
                        <button
                          onClick={() => handleConvertToFlashcard(q)}
                          disabled={convertedFlashcards[q.id]}
                          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{convertedFlashcards[q.id] ? 'Saved as Flashcard ✓' : 'Save as Spaced Flashcard'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Quiz button */}
          {!quizSubmitted && (
            <button
              onClick={handleSubmitQuiz}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl transition-all"
            >
              Submit Test & Score Answers
            </button>
          )}
        </div>
      )}

      {/* Completed Quizzes Log */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="font-bold text-sm text-white">Quiz History & Previous Scores</h2>
        <div className="space-y-2">
          {quizzes.map((q) => (
            <div key={q.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-slate-100">{q.title}</p>
                <p className="text-[10px] text-slate-400">{q.questions.length} questions • Completed {q.completedAt}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
                Score: {q.score}%
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
