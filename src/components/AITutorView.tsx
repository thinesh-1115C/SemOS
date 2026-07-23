import React, { useState, useRef, useEffect } from 'react';
import { Subject, TutorMode, AIChatMessage, UserProfile, PDFDocument } from '../types';
import { 
  Bot, Sparkles, Send, BookOpen, Brain, Award, HelpCircle, 
  Lightbulb, Zap, Upload, FileText, CheckCircle2, X, Download, ChevronDown, Trash2, Folder
} from 'lucide-react';
import { FormattedMessage } from './FormattedMessage';
import { exportChatHistoryToPDF, exportChatHistoryToWord } from '../lib/exportUtils';
import { FileLibraryModal } from './FileLibraryModal';

interface AITutorViewProps {
  subjects: Subject[];
  pdfs: PDFDocument[];
  onAddPdf: (pdf: Omit<PDFDocument, 'id' | 'uploadDate'>) => PDFDocument | void;
  onDeletePdf?: (pdfId: string) => void;
  user?: UserProfile;
  initialSubjectId?: string;
}

export const AITutorView: React.FC<AITutorViewProps> = ({ 
  subjects, 
  pdfs,
  onAddPdf,
  onDeletePdf,
  user, 
  initialSubjectId 
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || subjects[0]?.id || ''
  );
  const [mode, setMode] = useState<TutorMode>('feynman');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Document Library Modal State
  const [isFileLibraryOpen, setIsFileLibraryOpen] = useState(false);
  const [attachedDocName, setAttachedDocName] = useState<string | null>(null);
  const [attachedDocText, setAttachedDocText] = useState<string>('');
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);

  const defaultInitialMessage: AIChatMessage = {
    id: 'init_1',
    sender: 'ai',
    text: `Welcome to the SemOS AI Tutor Hub! 🧠\n\nI am configured for **Feynman Technique Mode**. Pick a core topic you studied recently and explain it to me as if teaching a 10-year-old child.\n\nI will spot any hand-wavy assumptions or gaps in your explanation, provide LaTeX mathematical formulation where needed (e.g. $E = mc^2$ or $\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}$), and guide you to top exam scores!`,
    timestamp: 'Just now',
    mode: 'feynman',
  };

  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    const storageKey = `semos_ai_tutor_messages_${initialSubjectId || subjects[0]?.id || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [defaultInitialMessage];
  });

  // Load chat history whenever subject changes
  useEffect(() => {
    const storageKey = `semos_ai_tutor_messages_${selectedSubjectId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (err) {
        setMessages([defaultInitialMessage]);
      }
    } else {
      setMessages([defaultInitialMessage]);
    }
  }, [selectedSubjectId]);

  // Persist messages to LocalStorage
  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = `semos_ai_tutor_messages_${selectedSubjectId}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, selectedSubjectId]);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const handleClearHistory = () => {
    if (confirm('Clear chat history for this subject?')) {
      const storageKey = `semos_ai_tutor_messages_${selectedSubjectId}`;
      localStorage.removeItem(storageKey);
      setMessages([defaultInitialMessage]);
    }
  };

  const promptChips = [
    { label: 'Feynman Test: BJT Biasing', text: 'I want to explain BJT Voltage Divider Biasing in simple terms to test my Feynman understanding.', mode: 'feynman' },
    { label: "Explain: Green's Theorem", text: "Explain Green's Theorem step-by-step with LaTeX equations and intuitive physical analogies.", mode: 'explain' },
    { label: 'Exam Mode: AVL Trees', text: 'Give me a typical university exam question on AVL Tree LR rotations with C++ code snippet.', mode: 'exam' },
    { label: 'Viva Oral Interview', text: 'Act as my professor and conduct a 3-question viva on Semiconductor Physics.', mode: 'interview' },
  ];

  const handleFileUpload = async (file: File) => {
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to parse document');
      const data = await res.json();

      setAttachedDocName(data.fileName || file.name);
      setAttachedDocText(data.extractedText || '');
    } catch (err) {
      console.error('File parse error in AI Tutor:', err);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    let fullPromptText = textToSend;
    if (attachedDocText) {
      fullPromptText = `[Attached Document Context: "${attachedDocName}"]\nExcerpt: ${attachedDocText.slice(0, 4000)}\n\nStudent Query: ${textToSend}`;
    }

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend + (attachedDocName ? ` (Attached: ${attachedDocName})` : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
      subjectId: selectedSubjectId,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullPromptText,
          mode,
          subject: selectedSubject?.name || 'Engineering & Computer Science',
          conversationHistory: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text })),
          studentContext: {
            semester: selectedSubject?.semester || user?.semester || 'Semester 3',
            targetGpa: user?.targetGpa || 9.0,
            weakAreas: selectedSubject?.weakAreas || [],
          },
        }),
      });

      const data = await res.json();
      const aiReply: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'Response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
        subjectId: selectedSubjectId,
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error('AI Tutor error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 text-[#1A1A1A]">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F6F4F0] p-6 rounded-3xl border border-[#EAE7E0] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1A1A1A] text-[#A68942] shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              SemOS AI Tutor Hub
            </h1>
            <p className="text-xs text-zinc-600">
              6 Pedagogical Modes • LaTeX & Code Sandbox
            </p>
          </div>
        </div>

        {/* Subject Selector & Export Dropdown */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#A68942]" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#A68942]"
            >
              {subjects.length === 0 ? (
                <option value="">General AI Tutor</option>
              ) : (
                subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {(s?.name || '').split('(')[0]?.trim() || s.code}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Export Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold text-xs shadow-xs transition-all"
              id="download-chat-dropdown-btn"
            >
              <Download className="w-3.5 h-3.5 text-[#A68942]" />
              <span>Download Chat</span>
              <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xl p-1.5 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    exportChatHistoryToPDF(messages, selectedSubject?.name || 'Engineering');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] hover:bg-[#F6F4F0] flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Export as PDF</span>
                </button>

                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    exportChatHistoryToWord(messages, selectedSubject?.name || 'Engineering');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] hover:bg-[#F6F4F0] flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Export as Word (.docx)</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-zinc-500 hover:text-rose-600 hover:border-rose-300 transition-colors"
            title="Clear chat history for this subject"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {[
          { id: 'explain', label: 'Explain', desc: 'Step-by-step', icon: Lightbulb },
          { id: 'beginner', label: 'Beginner', desc: 'No jargon', icon: Zap },
          { id: 'expert', label: 'Expert', desc: 'Deep math', icon: Brain },
          { id: 'exam', label: 'Exam', desc: 'Past papers', icon: Award },
          { id: 'interview', label: 'Viva Oral', desc: 'Oral test', icon: HelpCircle },
          { id: 'feynman', label: 'Feynman', desc: 'Teach the AI', icon: Sparkles },
        ].map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id as TutorMode)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#FBFBF9] shadow-sm font-bold'
                  : 'bg-[#FBFBF9] border-[#EAE7E0] text-zinc-600 hover:bg-[#F6F4F0]'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-[#A68942]' : 'text-zinc-500'}`} />
              <p className="font-bold text-xs">{m.label}</p>
              <p className={`text-[9px] mt-0.5 ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold shrink-0">Quick Prompts:</span>
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              setMode(chip.mode as TutorMode);
              handleSend(chip.text);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-zinc-700 whitespace-nowrap text-[11px] transition-colors"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-4 shadow-sm min-h-[400px] flex flex-col justify-between">
        
        <div className="space-y-4 overflow-y-auto max-h-[480px] pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] text-[#A68942] flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              
              <div
                className={`max-w-[88%] p-4 rounded-2xl leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#1A1A1A] text-[#FBFBF9] rounded-tr-none font-medium'
                    : 'bg-[#F6F4F0] text-[#1A1A1A] border border-[#EAE7E0] rounded-tl-none shadow-xs'
                }`}
              >
                {msg.sender === 'ai' ? (
                  <FormattedMessage content={msg.text} isAi={true} />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}

                <div className={`flex items-center justify-between text-[9px] mt-2 pt-1 border-t ${
                  msg.sender === 'user' ? 'border-[#333333] text-zinc-400' : 'border-[#EAE7E0] text-zinc-500'
                }`}>
                  <span className="uppercase font-mono font-bold tracking-wider">{msg.mode || mode} mode</span>
                  <span>{msg.timestamp}</span>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#A68942] italic font-mono p-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>AI Tutor is formulating step-by-step answer in {mode.toUpperCase()} mode...</span>
            </div>
          )}
        </div>

        {/* Attached Document Pill */}
        {attachedDocName && (
          <div className="px-3 py-1.5 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] flex items-center justify-between text-xs text-zinc-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#A68942]" />
              <span className="font-bold truncate max-w-xs">{attachedDocName}</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">Attached to Context</span>
            </div>
            <button
              onClick={() => {
                setAttachedDocName(null);
                setAttachedDocText('');
              }}
              className="p-1 text-zinc-400 hover:text-rose-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Controls */}
        <div className="pt-3 border-t border-[#EAE7E0] flex items-center gap-2">
          
          <button
            onClick={() => setIsFileLibraryOpen(true)}
            className="p-3 rounded-2xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            title="Attach file from Inbuilt Library or Upload"
            id="open-file-library-btn"
          >
            <Folder className="w-4 h-4 text-[#A68942]" />
            <span className="hidden sm:inline">File Library</span>
          </button>

          <input
            type="text"
            placeholder={`Ask AI Tutor in ${mode.toUpperCase()} mode or explain concept...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-3 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#A68942]"
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] disabled:opacity-50 text-[#FBFBF9] font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0"
            id="send-ai-tutor-btn"
          >
            <span>Send</span>
            <Send className="w-4 h-4 text-[#A68942]" />
          </button>

        </div>

      </div>

      {/* File Library Modal */}
      <FileLibraryModal
        isOpen={isFileLibraryOpen}
        onClose={() => setIsFileLibraryOpen(false)}
        pdfs={pdfs}
        subjects={subjects}
        onSelectPdf={(pdf) => {
          setAttachedDocName(pdf.title);
          setAttachedDocText(pdf.extractedText || pdf.summary || '');
        }}
        onAddPdf={onAddPdf}
        onDeletePdf={onDeletePdf}
        title="Attach Document to AI Tutor"
        subtitle="Select from previously uploaded study materials or upload a new file from your device"
        actionLabel="Attach to Chat"
      />

    </div>
  );
};
