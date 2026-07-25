import React, { useState, useRef } from 'react';
import { Subject, Flashcard, PDFDocument } from '../types';
import { FileLibraryModal } from './FileLibraryModal';
import { 
  Layers, RotateCw, Sparkles, CheckCircle2, Clock, 
  Flame, Plus, HelpCircle, ArrowRight, Check, RefreshCw,
  Upload, FileText, X, FolderOpen, Loader2, BookOpen, Search, Filter, BarChart2, Award
} from 'lucide-react';

interface FlashcardViewProps {
  subjects: Subject[];
  flashcards: Flashcard[];
  pdfs?: PDFDocument[];
  onAddPdf?: (pdf: Omit<PDFDocument, 'id' | 'uploadDate'>) => PDFDocument | void;
  onDeletePdf?: (pdfId: string) => void;
  onAddFlashcard: (card: Omit<Flashcard, 'id' | 'nextReviewDate' | 'intervalDays' | 'reviewCount' | 'easeFactor'>) => void;
  onUpdateFlashcardReview: (id: string, difficultyRating: 'again' | 'hard' | 'good' | 'easy') => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  subjects,
  flashcards,
  pdfs = [],
  onAddPdf,
  onDeletePdf,
  onAddFlashcard,
  onUpdateFlashcardReview,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<'srs' | 'typing' | 'browser'>('srs');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [showAnswerCheck, setShowAnswerCheck] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');

  // Generator modal
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genText, setGenText] = useState('');
  const [genSubjectId, setGenSubjectId] = useState(subjects[0]?.id || 'custom');
  const [customSubjectCode, setCustomSubjectCode] = useState('');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [generationMode, setGenerationMode] = useState<'quick' | 'comprehensive' | 'exhaustive'>('comprehensive');
  const [isGenerating, setIsGenerating] = useState(false);

  // Attached File State for AI Generator
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileText, setAttachedFileText] = useState<string>('');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCards = flashcards.filter(f => {
    const matchesSubject = selectedSubjectId === 'all' || f.subjectId === selectedSubjectId;
    const matchesDiff = difficultyFilter === 'all' || f.difficulty === difficultyFilter;
    const matchesSearch = searchQuery === '' || 
      f.front.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesDiff && matchesSearch;
  });

  const currentCard = filteredCards[currentIndex];

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
      if (!genTopic) {
        setGenTopic(file.name.replace(/\.[^/.]+$/, ''));
      }

      if (onAddPdf) {
        onAddPdf({
          subjectId: genSubjectId !== 'custom' ? genSubjectId : 'general',
          title: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          pageCount: Math.max(1, Math.ceil(extractedText.length / 1500)),
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

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    onUpdateFlashcardReview(currentCard.id, rating);
    setIsFlipped(false);
    setTypedAnswer('');
    setShowAnswerCheck(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleGenerateAiCards = async () => {
    if (!genTopic.trim()) return;
    setIsGenerating(true);

    try {
      const subjectObj = subjects.find(s => s.id === genSubjectId);
      const subjectDisplayName = genSubjectId === 'custom' 
        ? `${customSubjectCode || 'GEN'} ${customSubjectName || 'General Subject'}`
        : subjectObj?.name || 'Computer Science';

      const combinedText = [attachedFileText, genText].filter(Boolean).join('\n\n');

      const res = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopic,
          sourceText: combinedText,
          subject: subjectDisplayName,
          generationMode,
          count: generationMode === 'quick' ? 10 : generationMode === 'comprehensive' ? 20 : 30,
        }),
      });

      const data = await res.json();
      if (data.flashcards && Array.isArray(data.flashcards)) {
        data.flashcards.forEach((fc: any) => {
          onAddFlashcard({
            subjectId: genSubjectId !== 'custom' ? genSubjectId : 'general',
            topic: genTopic,
            front: fc.front,
            back: fc.back,
            difficulty: fc.difficulty || 'Medium',
          });
        });
      }
      setGenTopic('');
      setGenText('');
      setAttachedFileName(null);
      setAttachedFileText('');
      setShowGenerator(false);
    } catch (err) {
      console.error('Failed to generate flashcards:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 text-slate-100">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Advanced Anki SRS Deck Engine</h1>
            <p className="text-xs text-slate-400">Proportional content-aware card generator with SM-2 memory retention algorithm</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => { setStudyMode('srs'); setCurrentIndex(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${studyMode === 'srs' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              SRS Flip Deck
            </button>
            <button
              onClick={() => { setStudyMode('typing'); setCurrentIndex(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${studyMode === 'typing' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Active Recall (Type)
            </button>
            <button
              onClick={() => setStudyMode('browser')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${studyMode === 'browser' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Deck Browser ({flashcards.length})
            </button>
          </div>

          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Smart Generator</span>
          </button>
        </div>
      </div>

      {/* Advanced AI Generator Box */}
      {showGenerator && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-amber-500/40 space-y-5 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Proportional Content-Aware Flashcard Generator</span>
            </h2>
            <span className="text-[11px] text-amber-400 font-mono bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Auto-scales up to 35+ cards based on file size & content depth
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Select Subject</label>
              <select
                value={genSubjectId}
                onChange={(e) => setGenSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.code} - {(s?.name || '').split('(')[0]}</option>
                ))}
                <option value="custom">+ Type Custom Subject</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Topic / Chapter Name *</label>
              <input
                type="text"
                placeholder="e.g. Semiconductor Physics & Junction Diodes"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Generation Depth & Count</label>
              <select
                value={generationMode}
                onChange={(e: any) => setGenerationMode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="quick">Quick High-Yield (10 Cards)</option>
                <option value="comprehensive">Comprehensive Chapter Master (20 Cards)</option>
                <option value="exhaustive">Exhaustive Proportional Deck (Up to 35+ Cards based on file)</option>
              </select>
            </div>
          </div>

          {genSubjectId === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Custom Code</label>
                <input
                  type="text"
                  placeholder="e.g. PHY201"
                  value={customSubjectCode}
                  onChange={(e) => setCustomSubjectCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Custom Name</label>
                <input
                  type="text"
                  placeholder="e.g. Quantum Physics"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* File Upload / Attachment Area */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 block">
              Attach Source Document / PDF / Word / Text File (Triggers Proportional Scaling)
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
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold truncate">{attachedFileName}</p>
                    <p className="text-[10px] text-amber-400/80 font-mono">
                      {attachedFileText ? `${attachedFileText.length} chars loaded → scales card count automatically` : 'File ready'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAttachedFileName(null);
                    setAttachedFileText('');
                  }}
                  className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors shrink-0"
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
                  className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-amber-500/50 flex items-center justify-center gap-2 text-xs text-slate-300 transition-all group"
                >
                  {isParsingFile ? (
                    <>
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>Extracting File Text & Equations...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>Upload Document (.pdf, .docx, .txt)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLibraryModalOpen(true)}
                  className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 flex items-center justify-center gap-2 text-xs text-slate-300 transition-all group"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Pick from Inbuilt Library ({pdfs.length})</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Additional Notes / Key Formulas (Optional)</label>
            <textarea
              placeholder="Paste specific lecture highlights or formulas..."
              value={genText}
              onChange={(e) => setGenText(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowGenerator(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateAiCards}
              disabled={isGenerating || !genTopic.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Proportional Deck...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Deck Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Library Modal */}
      <FileLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        pdfs={pdfs}
        subjects={subjects}
        onSelectPdf={(pdf) => {
          setAttachedFileName(pdf.title);
          setAttachedFileText(pdf.extractedText || '');
          if (!genTopic) setGenTopic(pdf.title.replace(/\.[^/.]+$/, ''));
          setIsLibraryModalOpen(false);
        }}
        onAddPdf={onAddPdf || (() => {})}
        onDeletePdf={onDeletePdf}
        title="Select Document for Flashcard Generator"
        subtitle="Choose a course PDF or Word document to scale card generation"
      />

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
          >
            <option value="all">All Subjects Deck ({flashcards.length})</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} - {(s?.name || '').split('(')[0]}</option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e: any) => {
              setDifficultyFilter(e.target.value);
              setCurrentIndex(0);
            }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search flashcards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="text-slate-400 font-mono font-bold shrink-0">
          Showing {filteredCards.length > 0 ? currentIndex + 1 : 0} of {filteredCards.length} cards
        </div>
      </div>

      {/* STUDY MODE 1: SRS FLIP DECK */}
      {studyMode === 'srs' && (
        currentCard ? (
          <div className="space-y-6">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[320px] p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-indigo-500/30 hover:border-indigo-500/60 shadow-2xl cursor-pointer flex flex-col justify-between transition-all duration-300 group relative"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                <span className="font-bold text-indigo-400 uppercase tracking-wider">{currentCard.topic}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    currentCard.difficulty === 'Hard' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    currentCard.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {currentCard.difficulty}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px]">
                    {isFlipped ? 'Back (Answer)' : 'Front (Question)'}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="my-auto text-center px-4 py-8">
                {!isFlipped ? (
                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                      {currentCard.front}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-1.5 pt-2">
                      <RotateCw className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>Click card or press space to flip answer</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-base sm:text-xl font-medium text-amber-200 leading-relaxed font-mono">
                      {currentCard.back}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                <span>SRS Interval: {currentCard.intervalDays} days</span>
                <span>Review Count: {currentCard.reviewCount}</span>
                <span>Ease Factor: {currentCard.easeFactor}</span>
              </div>
            </div>

            {/* Spaced Repetition Rating Buttons */}
            {isFlipped && (
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 text-center animate-fade-in shadow-xl">
                <p className="text-xs font-semibold text-slate-300">Rate your recall accuracy for SM-2 interval adjustment:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleRating('again')}
                    className="py-3 px-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow"
                  >
                    Again (1d)
                  </button>
                  <button
                    onClick={() => handleRating('hard')}
                    className="py-3 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow"
                  >
                    Hard (2d)
                  </button>
                  <button
                    onClick={() => handleRating('good')}
                    className="py-3 px-4 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all shadow"
                  >
                    Good (4d)
                  </button>
                  <button
                    onClick={() => handleRating('easy')}
                    className="py-3 px-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow"
                  >
                    Easy (7d)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
            <Layers className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="font-bold text-lg text-white">No Flashcards Found</h3>
            <p className="text-xs text-slate-400">Click "AI Smart Generator" above to generate a comprehensive deck instantly.</p>
          </div>
        )
      )}

      {/* STUDY MODE 2: ACTIVE RECALL TYPING */}
      {studyMode === 'typing' && (
        currentCard ? (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-indigo-400 uppercase tracking-wider text-xs">{currentCard.topic}</span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                Active Recall Typing Mode
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white leading-relaxed">
                {currentCard.front}
              </h3>
            </div>

            {!showAnswerCheck ? (
              <div className="space-y-4">
                <textarea
                  placeholder="Type your answer or explanation here..."
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  rows={3}
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => setShowAnswerCheck(true)}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
                >
                  Check Answer & Grade
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-400">Your Answer:</p>
                  <p className="text-sm font-mono text-slate-200">{typedAnswer || '(No answer typed)'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <p className="text-xs font-semibold text-amber-300">Correct Answer / Explanation:</p>
                  <p className="text-base font-mono text-amber-200">{currentCard.back}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300 text-center">Rate your recall accuracy:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => handleRating('again')}
                      className="py-3 px-4 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold"
                    >
                      Again
                    </button>
                    <button
                      onClick={() => handleRating('hard')}
                      className="py-3 px-4 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold"
                    >
                      Hard
                    </button>
                    <button
                      onClick={() => handleRating('good')}
                      className="py-3 px-4 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold"
                    >
                      Good
                    </button>
                    <button
                      onClick={() => handleRating('easy')}
                      className="py-3 px-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold"
                    >
                      Easy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
            <Layers className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="font-bold text-lg text-white">No Flashcards In Deck</h3>
            <p className="text-xs text-slate-400">Click "AI Smart Generator" above to build your deck.</p>
          </div>
        )
      )}

      {/* STUDY MODE 3: DECK BROWSER & ANALYTICS */}
      {studyMode === 'browser' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Deck Size</p>
                <p className="text-xl font-bold text-white font-mono">{flashcards.length} Cards</p>
              </div>
            </div>
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Due for Review</p>
                <p className="text-xl font-bold text-white font-mono">
                  {flashcards.filter(f => new Date(f.nextReviewDate) <= new Date()).length} Cards
                </p>
              </div>
            </div>
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Avg Interval Mastery</p>
                <p className="text-xl font-bold text-white font-mono">
                  {flashcards.length > 0 ? Math.round(flashcards.reduce((acc, f) => acc + f.intervalDays, 0) / flashcards.length) : 0} Days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Deck Card Browser ({filteredCards.length})</span>
              </h3>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
              {filteredCards.length > 0 ? (
                filteredCards.map((card, idx) => (
                  <div key={card.id} className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold">#{idx + 1}</span>
                        <span className="text-xs font-bold text-amber-300">{card.topic}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          card.difficulty === 'Hard' ? 'bg-rose-500/20 text-rose-300' :
                          card.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {card.difficulty}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">{card.front}</p>
                      <p className="text-xs font-mono text-slate-400 bg-slate-950 p-2 rounded-xl">{card.back}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono shrink-0">
                      <div>
                        <p>Interval: {card.intervalDays}d</p>
                        <p>Reviews: {card.reviewCount}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No flashcards match the current filter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

