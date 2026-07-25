import React, { useState, useRef } from 'react';
import { Subject, PDFDocument } from '../types';
import { 
  FileText, Upload, Sparkles, BookOpen, Search, 
  HelpCircle, Zap, FileUp, Check, ArrowRight, Eye, RefreshCw, X, AlertCircle, Folder
} from 'lucide-react';
import { FormattedMessage } from './FormattedMessage';
import { FileLibraryModal } from './FileLibraryModal';

interface PDFBrainViewProps {
  subjects: Subject[];
  pdfs: PDFDocument[];
  onAddPDF: (pdf: Omit<PDFDocument, 'id' | 'uploadDate'>) => PDFDocument | void;
  onDeletePDF?: (pdfId: string) => void;
}

export const PDFBrainView: React.FC<PDFBrainViewProps> = ({
  subjects,
  pdfs,
  onAddPDF,
  onDeletePDF,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isFileLibraryOpen, setIsFileLibraryOpen] = useState<boolean>(false);
  const [selectedPdfId, setSelectedPdfId] = useState<string>(pdfs[0]?.id || '');
  const [docAction, setDocAction] = useState<string>('summarize');
  const [userQuestion, setUserQuestion] = useState('');
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // PDF View Mode: 'visual' for embedded PDF iframe/object viewer, 'analysis' for extracted AI view
  const [viewMode, setViewMode] = useState<'visual' | 'analysis'>('analysis');

  // File Upload State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');

  const selectedPdf = pdfs.find(p => p.id === selectedPdfId);

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

      if (!res.ok) throw new Error('Failed to parse PDF document.');

      const data = await res.json();
      const objectUrl = URL.createObjectURL(file);

      const newDoc: Omit<PDFDocument, 'id' | 'uploadDate'> = {
        subjectId: selectedSubjectId,
        title: data.fileName || file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        pageCount: data.pageCount || 1,
        extractedText: data.extractedText || '',
        summary: data.extractedText ? data.extractedText.slice(0, 200) + '...' : 'Extracted lecture slides/PDF document.',
        extractedKeyPoints: [
          'Document uploaded and indexed into SemOS Brain.',
          `Extracted ${data.pageCount || 1} pages/slides.`,
          'Formulae & key terms indexed for AI Tutor queries.',
        ],
        fileUrl: objectUrl,
      };

      onAddPDF(newDoc);
      setViewMode('visual');
    } catch (err: any) {
      console.error('PDF upload error:', err);
      setUploadError(err?.message || 'Failed to upload PDF. Please select a valid .PDF or .PPTX file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunAiAction = async () => {
    if (!selectedPdf || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/pdf-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentName: selectedPdf.title,
          documentText: selectedPdf.extractedText,
          action: docAction,
          userQuestion,
        }),
      });

      const data = await res.json();
      setAiOutput(data.result || 'Analysis completed.');
      setViewMode('analysis');
    } catch (err) {
      console.error('PDF Action failed:', err);
      setAiOutput('Failed to process document action.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#1A1A1A]">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#F6F4F0] p-6 rounded-3xl border border-[#EAE7E0] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1A1A1A] text-[#A68942] shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              PDF & Document Brain
            </h1>
            <p className="text-xs text-zinc-600">
              Upload local PDFs, Word & PowerPoint documents, view actual visual pages, extract equations & run AI analysis
            </p>
          </div>
        </div>

        {/* Upload Trigger & Library Controls - SINGLE UNIFIED OPTION */}
        <div className="flex items-center gap-2">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept=".pdf,.ppt,.pptx,.txt,.doc,.docx"
            className="hidden"
          />

          <button
            onClick={() => setIsFileLibraryOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0"
            id="open-pdf-brain-library-btn"
          >
            <Folder className="w-4 h-4 text-[#A68942]" />
            <span>Inbuilt File Library ({pdfs.length})</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: PDF Document Library */}
        <div className="p-5 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-xs uppercase tracking-wider text-zinc-500">
              PDF Document Library ({pdfs.length})
            </h2>
            <button 
              onClick={() => setIsFileLibraryOpen(true)}
              className="text-[11px] font-bold text-[#A68942] hover:underline"
            >
              + Add File
            </button>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {pdfs.map((pdf) => {
              const isSelected = pdf.id === selectedPdfId;
              const subject = subjects.find(s => s.id === pdf.subjectId);
              return (
                <div
                  key={pdf.id}
                  onClick={() => {
                    setSelectedPdfId(pdf.id);
                    setAiOutput(null);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#FBFBF9] shadow-sm'
                      : 'bg-[#F6F4F0] border-[#EAE7E0] text-[#1A1A1A] hover:border-[#A68942]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[#A68942]' : 'text-zinc-500'}`}>
                      {subject?.code || 'PDF'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{pdf.pageCount} pgs</span>
                  </div>
                  
                  <p className="font-serif font-bold text-xs mt-1 truncate">{pdf.title}</p>
                  
                  <p className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {pdf.fileSize} • Uploaded Document
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Visual Viewer & AI Analysis Panel */}
        <div className="lg:col-span-2 space-y-4">
          
          {selectedPdf ? (
            <div className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] space-y-5 shadow-xs">
              
              {/* Document Subheader & View Mode Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE7E0] pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#A68942] uppercase tracking-wider">
                    {selectedPdf.fileSize} • {selectedPdf.pageCount} Pages
                  </span>
                  <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">
                    {selectedPdf.title}
                  </h2>
                </div>

                {/* View Mode Toggle: Visual PDF Viewer vs AI Context */}
                <div className="flex bg-[#F6F4F0] p-1 rounded-2xl border border-[#EAE7E0] text-xs font-bold">
                  <button
                    onClick={() => setViewMode('visual')}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      viewMode === 'visual'
                        ? 'bg-[#1A1A1A] text-[#FBFBF9] shadow-xs'
                        : 'text-zinc-600 hover:text-[#1A1A1A]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-[#A68942]" />
                    <span>Visual PDF View</span>
                  </button>

                  <button
                    onClick={() => setViewMode('analysis')}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      viewMode === 'analysis'
                        ? 'bg-[#1A1A1A] text-[#FBFBF9] shadow-xs'
                        : 'text-zinc-600 hover:text-[#1A1A1A]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#A68942]" />
                    <span>AI Analysis & QA</span>
                  </button>
                </div>
              </div>

              {/* MODE 1: Actual Visual PDF Document Viewer */}
              {viewMode === 'visual' && (
                <div className="space-y-4">
                  {Boolean(selectedPdf?.fileUrl) ? (
                    <div className="w-full h-[520px] rounded-2xl border border-[#EAE7E0] overflow-hidden bg-[#F6F4F0]">
                      <iframe
                        src={selectedPdf.fileUrl}
                        title={selectedPdf.title}
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-center space-y-3">
                      <FileText className="w-10 h-10 text-[#A68942] mx-auto" />
                      <p className="font-serif font-bold text-sm text-[#1A1A1A]">
                        Extracted Document Text Preview
                      </p>
                      <div className="p-4 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-xs font-mono text-zinc-700 max-h-80 overflow-y-auto text-left leading-relaxed">
                        {selectedPdf.extractedText || 'No text extracted for this sample document.'}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        💡 Upload a new PDF file using the <strong>"Upload PDF Document"</strong> button at the top to view live visual rendered PDF pages!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: AI Analysis & Document Q&A */}
              {viewMode === 'analysis' && (
                <div className="space-y-4">
                  
                  {/* AI Actions Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'summarize', label: 'Summarize Chapter' },
                      { id: 'explain_concepts', label: 'Core Concepts' },
                      { id: 'extract_formulas', label: 'Extract Formulae' },
                      { id: 'ask_document', label: 'Ask Document' },
                    ].map((act) => (
                      <button
                        key={act.id}
                        onClick={() => setDocAction(act.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all font-bold ${
                          docAction === act.id
                            ? 'bg-[#1A1A1A] text-[#FBFBF9] border-[#1A1A1A] shadow-xs'
                            : 'bg-[#F6F4F0] border-[#EAE7E0] text-zinc-600 hover:bg-[#EAE7E0]'
                        }`}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>

                  {docAction === 'ask_document' && (
                    <input
                      type="text"
                      placeholder="Ask a specific question about this PDF document..."
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#A68942]"
                    />
                  )}

                  <button
                    onClick={handleRunAiAction}
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#A68942]" />
                    <span>{loading ? 'Analyzing PDF with AI...' : 'Run AI Document Analysis'}</span>
                  </button>

                  {/* AI Output Result Box */}
                  {aiOutput ? (
                    <div className="p-5 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs text-[#1A1A1A] leading-relaxed max-h-96 overflow-y-auto">
                      <span className="font-serif font-bold text-[#A68942] block mb-2 text-sm">
                        AI Analysis & Key Insights:
                      </span>
                      <FormattedMessage content={aiOutput} isAi={true} />
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs space-y-2">
                      <p className="font-serif font-bold text-[#1A1A1A]">Document Summary & Indexing:</p>
                      <p className="text-zinc-600 text-xs">{selectedPdf.summary}</p>

                      {selectedPdf.extractedKeyPoints && (
                        <ul className="list-disc list-inside space-y-1 text-zinc-700 text-xs pt-2 border-t border-[#EAE7E0]">
                          {selectedPdf.extractedKeyPoints.map((pt, idx) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center bg-[#FBFBF9] rounded-3xl border border-[#EAE7E0] text-zinc-500 text-xs">
              Select or upload a PDF document to begin viewing and AI analysis.
            </div>
          )}

        </div>

      </div>

      {/* File Library Modal */}
      <FileLibraryModal
        isOpen={isFileLibraryOpen}
        onClose={() => setIsFileLibraryOpen(false)}
        pdfs={pdfs}
        subjects={subjects}
        onSelectPdf={(pdf) => {
          setSelectedPdfId(pdf.id);
          setViewMode('visual');
        }}
        onAddPdf={(newPdf) => {
          const res = onAddPDF(newPdf);
          if (res) setSelectedPdfId(res.id);
          return res;
        }}
        onDeletePdf={onDeletePDF}
        title="Inbuilt File Library"
        subtitle="Manage and analyze saved documents or upload new files"
        actionLabel="Open & Analyze"
      />

    </div>
  );
};
