import React, { useState } from 'react';
import { 
  Subject, NoteItem, PDFDocument, Flashcard, Quiz, AssignmentTask, 
  AIChatMessage, TutorMode 
} from '../types';
import { 
  BookOpen, FileText, Bot, Layers, HelpCircle, CheckSquare, 
  History, Plus, Sparkles, Send, Upload, Edit3, Trash2, ArrowLeft,
  Zap, CheckCircle2, AlertCircle, FileUp
} from 'lucide-react';

interface SubjectWorkspaceProps {
  subject: Subject;
  notes: NoteItem[];
  pdfs: PDFDocument[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  assignments: AssignmentTask[];
  onAddNote: (note: Omit<NoteItem, 'id' | 'updatedAt'>) => void;
  onAddPDF: (pdf: Omit<PDFDocument, 'id' | 'uploadDate'>) => void;
  onAddFlashcard: (card: Omit<Flashcard, 'id' | 'nextReviewDate' | 'intervalDays' | 'reviewCount' | 'easeFactor'>) => void;
  onBack: () => void;
}

export const SubjectWorkspace: React.FC<SubjectWorkspaceProps> = ({
  subject,
  notes,
  pdfs,
  flashcards,
  quizzes,
  assignments,
  onAddNote,
  onAddPDF,
  onAddFlashcard,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'pdfs' | 'chat' | 'flashcards' | 'quizzes' | 'assignments'>('notes');

  // Notes state
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello! I am your AI Tutor for **${subject.name}**. I remember your weak areas (${subject.weakAreas.join(', ')}). How can I assist your study session today?`,
      timestamp: 'Just now',
      mode: 'explain',
      subjectId: subject.id,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [tutorMode, setTutorMode] = useState<TutorMode>('explain');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // PDF Upload simulation state
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [uploadPdfTitle, setUploadPdfTitle] = useState('');
  const [uploadPdfText, setUploadPdfText] = useState('');

  // Note save handler
  const handleSaveNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    onAddNote({
      subjectId: subject.id,
      title: newNoteTitle,
      content: newNoteContent,
      tags: [subject.code, 'Study Note'],
    });
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowNewNoteForm(false);
  };

  // AI Chat message handler
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isAiTyping) return;

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: tutorMode,
      subjectId: subject.id,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const messagePrompt = chatInput;
    setChatInput('');
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messagePrompt,
          mode: tutorMode,
          subject: subject.name,
          conversationHistory: chatMessages.slice(-6),
          studentContext: {
            semester: subject.semester,
            weakAreas: subject.weakAreas,
          },
        }),
      });

      const data = await res.json();
      const aiReply: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'I am processing your query.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: tutorMode,
        subjectId: subject.id,
      };
      setChatMessages((prev) => [...prev, aiReply]);
    } catch (error) {
      console.error('Failed to communicate with AI Tutor:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Apologies, I encountered a connection issue. Please verify your internet or try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // PDF upload handler
  const handleSavePdf = () => {
    if (!uploadPdfTitle.trim() || !uploadPdfText.trim()) return;
    onAddPDF({
      subjectId: subject.id,
      title: uploadPdfTitle,
      fileSize: '2.8 MB',
      pageCount: 18,
      extractedText: uploadPdfText,
      summary: 'Uploaded textbook/notes chapter.',
    });
    setUploadPdfTitle('');
    setUploadPdfText('');
    setShowPdfUpload(false);
  };

  const subjectNotes = notes.filter((n) => n.subjectId === subject.id);
  const subjectPdfs = pdfs.filter((p) => p.subjectId === subject.id);
  const subjectCards = flashcards.filter((f) => f.subjectId === subject.id);
  const subjectQuizzes = quizzes.filter((q) => q.subjectId === subject.id);
  const subjectTasks = assignments.filter((a) => a.subjectId === subject.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
      
      {/* Header Bar with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-semibold">
                {subject.code}
              </span>
              <span className="text-xs text-slate-400">• Instructor: {subject.instructor}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{subject.name}</h1>
          </div>
        </div>

        {/* Attendance & Mastery Pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Attendance: </span>
            <span className="font-bold text-emerald-400">{subject.attendancePercent}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Mastery: </span>
            <span className="font-bold text-indigo-400">{subject.masteryPercent}%</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-1 text-xs font-semibold">
        {[
          { id: 'notes', label: `Notes (${subjectNotes.length})`, icon: BookOpen },
          { id: 'pdfs', label: `PDFs (${subjectPdfs.length})`, icon: FileText },
          { id: 'chat', label: 'AI Tutor Chat', icon: Bot, badge: '6 Modes' },
          { id: 'flashcards', label: `Flashcards (${subjectCards.length})`, icon: Layers },
          { id: 'quizzes', label: `Quizzes (${subjectQuizzes.length})`, icon: HelpCircle },
          { id: 'assignments', label: `Tasks (${subjectTasks.length})`, icon: CheckSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-950 text-indigo-200 border border-indigo-400/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-white">Subject Study Notes</h2>
            <button
              onClick={() => setShowNewNoteForm(!showNewNoteForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </button>
          </div>

          {showNewNoteForm && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <input
                type="text"
                placeholder="Note Title (e.g. Maxwell Equation Boundary Conditions)"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                placeholder="Write markdown note content, equations, code snippets..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={6}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewNoteForm(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectNotes.map((note) => (
              <div key={note.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">{note.title}</h3>
                  <span className="text-[10px] text-slate-500">{note.updatedAt}</span>
                </div>
                <div className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800/80 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </div>
                <div className="flex items-center gap-1.5 pt-2">
                  {note.tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PDFs */}
      {activeTab === 'pdfs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-white">Subject Textbooks & PDFs</h2>
            <button
              onClick={() => setShowPdfUpload(!showPdfUpload)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <FileUp className="w-4 h-4" />
              <span>Upload PDF Document</span>
            </button>
          </div>

          {showPdfUpload && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <input
                type="text"
                placeholder="PDF Title (e.g. Chapter 5 Semiconductor Junctions)"
                value={uploadPdfTitle}
                onChange={(e) => setUploadPdfTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Paste or drop extracted textbook text content..."
                value={uploadPdfText}
                onChange={(e) => setUploadPdfText(e.target.value)}
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPdfUpload(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePdf}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500"
                >
                  Process & Store PDF
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {subjectPdfs.map((pdf) => (
              <div key={pdf.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{pdf.title}</h3>
                      <p className="text-[10px] text-slate-400">
                        {pdf.fileSize} • {pdf.pageCount} pages • Uploaded {pdf.uploadDate}
                      </p>
                    </div>
                  </div>
                </div>

                {pdf.summary && (
                  <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-300 leading-relaxed border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-1">AI Executive Summary:</span>
                    {pdf.summary}
                  </div>
                )}

                {pdf.formulas && pdf.formulas.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950 text-xs text-amber-300 font-mono border border-slate-800 space-y-1">
                    <span className="font-bold text-amber-400 block">Extracted Formulae:</span>
                    {pdf.formulas.map((f, i) => (
                      <p key={i}>• {f}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AI TUTOR CHAT */}
      {activeTab === 'chat' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>AI Tutor Workspace — {subject.name}</span>
              </h2>
              <p className="text-[11px] text-slate-400">Select mode to change the explanation style</p>
            </div>

            {/* Mode selector dropdown */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              {[
                { id: 'explain', label: 'Explain' },
                { id: 'beginner', label: 'Beginner' },
                { id: 'expert', label: 'Expert' },
                { id: 'exam', label: 'Exam' },
                { id: 'interview', label: 'Viva' },
                { id: 'feynman', label: 'Feynman' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setTutorMode(m.id as TutorMode)}
                  className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
                    tutorMode === m.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                  <span className="block text-[9px] opacity-60 mt-1 text-right">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 italic font-mono">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>AI Tutor is formulating response in {tutorMode} mode...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              placeholder={`Ask AI Tutor about ${subject.name} in ${tutorMode.toUpperCase()} mode...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSendChatMessage}
              disabled={isAiTyping || !chatInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-white">Subject Flashcard Decks</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjectCards.map((card) => (
              <div key={card.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-indigo-400">{card.topic}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800">{card.difficulty}</span>
                </div>
                <p className="font-bold text-xs text-slate-100">{card.front}</p>
                <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-300 border border-slate-800/80">
                  {card.back}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-white">Subject Assessment Quizzes</h2>
          </div>

          <div className="space-y-3">
            {subjectQuizzes.map((q) => (
              <div key={q.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{q.title}</h3>
                  <p className="text-xs text-slate-400">{q.questions.length} Questions • Topic: {q.topic}</p>
                </div>
                {q.score !== undefined && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                    Score: {q.score}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: TASKS & ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-white">Assignments & Lab Reports</h2>
          </div>

          <div className="space-y-2">
            {subjectTasks.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckSquare className={`w-5 h-5 ${t.status === 'Completed' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <h3 className="font-bold text-xs text-white">{t.title}</h3>
                    <p className="text-[10px] text-slate-400">Weightage: {t.weightagePercent}% of grade</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-[10px]">
                    Due: {t.dueDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
