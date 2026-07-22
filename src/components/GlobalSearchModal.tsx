import React, { useState } from 'react';
import { Search, X, BookOpen, FileText, Layers, HelpCircle, ArrowRight } from 'lucide-react';
import { Subject, NoteItem, PDFDocument, Flashcard, Quiz } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  notes: NoteItem[];
  pdfs: PDFDocument[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  onSelectResult: (view: string, subjectId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  subjects,
  notes,
  pdfs,
  flashcards,
  quizzes,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingNotes = q
    ? notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    : notes.slice(0, 3);

  const matchingPdfs = q
    ? pdfs.filter(p => p.title.toLowerCase().includes(q) || p.extractedText.toLowerCase().includes(q))
    : pdfs.slice(0, 2);

  const matchingFlashcards = q
    ? flashcards.filter(f => f.front.toLowerCase().includes(q) || f.back.toLowerCase().includes(q) || f.topic.toLowerCase().includes(q))
    : flashcards.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-fade-in">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            placeholder="Search notes, PDFs, flashcards, topics across SemOS..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500 font-medium"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4 text-xs">
          
          {/* Notes Section */}
          {matchingNotes.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Subject Notes ({matchingNotes.length})</span>
              </p>
              <div className="space-y-1.5">
                {matchingNotes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      onSelectResult('subject', n.subjectId);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-100">{n.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{n.content}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDFs Section */}
          {matchingPdfs.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>PDF Documents ({matchingPdfs.length})</span>
              </p>
              <div className="space-y-1.5">
                {matchingPdfs.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectResult('pdf-brain');
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-100">{p.title}</p>
                      <p className="text-[10px] text-slate-400">{p.fileSize} • {p.pageCount} pages</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flashcards Section */}
          {matchingFlashcards.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Flashcards ({matchingFlashcards.length})</span>
              </p>
              <div className="space-y-1.5">
                {matchingFlashcards.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      onSelectResult('flashcards');
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[9px] font-bold text-amber-400 uppercase">{f.topic}</span>
                      <p className="font-bold text-slate-100">{f.front}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
