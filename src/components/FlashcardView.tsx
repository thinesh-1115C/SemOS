import React, { useState } from 'react';
import { Subject, Flashcard } from '../types';
import { 
  Layers, RotateCw, Sparkles, CheckCircle2, Clock, 
  Flame, Plus, HelpCircle, ArrowRight, Check, RefreshCw
} from 'lucide-react';

interface FlashcardViewProps {
  subjects: Subject[];
  flashcards: Flashcard[];
  onAddFlashcard: (card: Omit<Flashcard, 'id' | 'nextReviewDate' | 'intervalDays' | 'reviewCount' | 'easeFactor'>) => void;
  onUpdateFlashcardReview: (id: string, difficultyRating: 'again' | 'hard' | 'good' | 'easy') => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  subjects,
  flashcards,
  onAddFlashcard,
  onUpdateFlashcardReview,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Generator modal
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genText, setGenText] = useState('');
  const [genSubjectId, setGenSubjectId] = useState(subjects[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredCards = selectedSubjectId === 'all'
    ? flashcards
    : flashcards.filter(f => f.subjectId === selectedSubjectId);

  const currentCard = filteredCards[currentIndex];

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    onUpdateFlashcardReview(currentCard.id, rating);
    setIsFlipped(false);
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
      const res = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopic,
          sourceText: genText,
          subject: subjectObj?.name || 'Computer Science',
          count: 5,
        }),
      });

      const data = await res.json();
      if (data.flashcards && Array.isArray(data.flashcards)) {
        data.flashcards.forEach((fc: any) => {
          onAddFlashcard({
            subjectId: genSubjectId,
            topic: genTopic,
            front: fc.front,
            back: fc.back,
            difficulty: fc.difficulty || 'Medium',
          });
        });
      }
      setGenTopic('');
      setGenText('');
      setShowGenerator(false);
    } catch (err) {
      console.error('Failed to generate flashcards:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Anki Spaced Repetition Decks</h1>
            <p className="text-xs text-slate-400">SM-2 algorithm calculates intervals based on memory retention</p>
          </div>
        </div>

        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Deck Generator</span>
        </button>
      </div>

      {/* AI Generator Box */}
      {showGenerator && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-amber-500/40 space-y-4 shadow-2xl">
          <h2 className="font-bold text-sm text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Generate Flashcards from Notes or Topic</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Select Subject</label>
              <select
                value={genSubjectId}
                onChange={(e) => setGenSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name.split('(')[0]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Topic Name</label>
              <input
                type="text"
                placeholder="e.g. Green's Theorem Formulae & Edge Cases"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Source Text / Lecture Notes (Optional)</label>
            <textarea
              placeholder="Paste raw notes or chapter section..."
              value={genText}
              onChange={(e) => setGenText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowGenerator(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateAiCards}
              disabled={isGenerating || !genTopic.trim()}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50"
            >
              {isGenerating ? 'Generating 5 Cards...' : 'Generate 5 Flashcards'}
            </button>
          </div>
        </div>
      )}

      {/* Subject Filter Dropdown & Progress */}
      <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Filter Deck:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold"
          >
            <option value="all">All Subjects Deck ({flashcards.length})</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} - {s.name.split('(')[0]}</option>
            ))}
          </select>
        </div>

        <div className="text-slate-400 font-mono font-bold">
          Card {filteredCards.length > 0 ? currentIndex + 1 : 0} of {filteredCards.length}
        </div>
      </div>

      {/* 3D Interactive Flip Card */}
      {currentCard ? (
        <div className="space-y-6">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[280px] p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-indigo-500/30 hover:border-indigo-500/60 shadow-2xl cursor-pointer flex flex-col justify-between transition-all duration-300 group relative"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
              <span className="font-bold text-indigo-400 uppercase tracking-wider">{currentCard.topic}</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px]">
                {isFlipped ? 'Back (Answer)' : 'Front (Question)'}
              </span>
            </div>

            {/* Card Content Area */}
            <div className="my-auto text-center px-4 py-6">
              {!isFlipped ? (
                <div className="space-y-3">
                  <h3 className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                    {currentCard.front}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono flex items-center justify-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Click card to reveal answer</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-base sm:text-xl font-medium text-amber-200 leading-relaxed font-mono">
                    {currentCard.back}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
              <span>Interval: {currentCard.intervalDays} days</span>
              <span>Reviews: {currentCard.reviewCount}</span>
            </div>
          </div>

          {/* Spaced Repetition Grading Buttons (Only visible when card flipped) */}
          {isFlipped && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-center animate-fade-in">
              <p className="text-xs font-semibold text-slate-300 mb-2">Grade your recall accuracy:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleRating('again')}
                  className="py-3 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
                >
                  Again (1d)
                </button>
                <button
                  onClick={() => handleRating('hard')}
                  className="py-3 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
                >
                  Hard (2d)
                </button>
                <button
                  onClick={() => handleRating('good')}
                  className="py-3 px-4 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all"
                >
                  Good (4d)
                </button>
                <button
                  onClick={() => handleRating('easy')}
                  className="py-3 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
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
          <h3 className="font-bold text-lg text-white">No Flashcards In Deck</h3>
          <p className="text-xs text-slate-400">Click "AI Deck Generator" above to generate flashcards instantly.</p>
        </div>
      )}

    </div>
  );
};
