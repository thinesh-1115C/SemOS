import React, { useState } from 'react';
import { 
  PenTool, Sparkles, Copy, Check, ArrowRight, FileText, 
  Lightbulb, RefreshCw
} from 'lucide-react';

export const WritingAssistantView: React.FC = () => {
  const [content, setContent] = useState(`The experimental observations of the BJT common emitter amplifier showed that when base current IB increases, the collector current IC also increases proportionally until saturation occurs. Voltage divider biasing was implemented to stabilize the Q-point against thermal runaway.`);
  const [task, setTask] = useState('improve_assignment');
  const [style, setStyle] = useState('Academic');
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProcessWriting = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/writing-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          task,
          style,
        }),
      });

      const data = await res.json();
      setAiOutput(data.output || 'Draft processed.');
    } catch (err) {
      console.error('Writing assistant error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!aiOutput) return;
    navigator.clipboard.writeText(aiOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">AI Writing & Assignment Assistant</h1>
            <p className="text-xs text-slate-400">Refine lab reports, rewrite assignment drafts, and generate presentation slide outlines</p>
          </div>
        </div>
      </div>

      {/* Task Controls */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-400 block mb-1">Writing Action / Task</label>
            <select
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
            >
              <option value="improve_assignment">Improve Assignment Flow & Rigour</option>
              <option value="lab_observation">Generate Lab Observation & Report</option>
              <option value="rewrite_academic">Rewrite for Academic Tone</option>
              <option value="presentation_outline">Create Presentation Slide Outline</option>
              <option value="fix_grammar">Correct Grammar & Punctuation</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-400 block mb-1">Desired Tone / Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
            >
              <option value="Academic">Formal Academic & Technical</option>
              <option value="Scientific">Scientific Journal Rigour</option>
              <option value="Concise">Concise & Bulleted</option>
              <option value="Persuasive">Persuasive Thesis</option>
            </select>
          </div>
        </div>

        {/* Side by Side Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Input Draft */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Original Draft / Notes</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* AI Output Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">AI Refined Output</label>
              {aiOutput && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-indigo-300 hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Result'}</span>
                </button>
              )}
            </div>
            <div className="w-full p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 text-white text-xs font-mono leading-relaxed h-[192px] overflow-y-auto whitespace-pre-wrap">
              {aiOutput || 'Refined output will appear here after running...'}
            </div>
          </div>

        </div>

        <button
          onClick={handleProcessWriting}
          disabled={loading || !content.trim()}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Refining Academic Draft...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Process & Enhance Draft</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
