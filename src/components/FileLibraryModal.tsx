import React, { useState, useRef } from 'react';
import { Subject, PDFDocument } from '../types';
import { 
  FileText, Upload, Search, Trash2, CheckCircle2, 
  X, Sparkles, Folder, Plus, ArrowRight, Loader2, HardDrive
} from 'lucide-react';

export interface FileLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfs: PDFDocument[];
  subjects: Subject[];
  onSelectPdf: (pdf: PDFDocument) => void;
  onAddPdf: (pdf: Omit<PDFDocument, 'id' | 'uploadDate'>) => PDFDocument | void;
  onDeletePdf?: (pdfId: string) => void;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  acceptFormats?: string;
}

export const FileLibraryModal: React.FC<FileLibraryModalProps> = ({
  isOpen,
  onClose,
  pdfs,
  subjects,
  onSelectPdf,
  onAddPdf,
  onDeletePdf,
  title = "Inbuilt File Library",
  subtitle = "Choose from your previously uploaded documents or attach a new file from device",
  actionLabel = "Select File",
  acceptFormats = ".pdf,.ppt,.pptx,.txt,.doc,.docx"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'library' | 'device'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  
  // Upload State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtered library items
  const filteredPdfs = pdfs.filter(pdf => {
    const matchesSearch = pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pdf.extractedText && pdf.extractedText.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = filterSubjectId === 'all' || pdf.subjectId === filterSubjectId;
    return matchesSearch && matchesSubject;
  });

  const handleDeviceFileUpload = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      let extractedText = '';
      let pageCount = 1;
      let fileName = file.name;

      if (res.ok) {
        const data = await res.json();
        extractedText = data.extractedText || '';
        pageCount = data.pageCount || 1;
        fileName = data.fileName || file.name;
      } else {
        // Fallback reading as plain text if text file
        try {
          extractedText = await file.text();
        } catch {
          extractedText = `Document content for ${file.name}`;
        }
      }

      const objectUrl = URL.createObjectURL(file);

      const newDoc: Omit<PDFDocument, 'id' | 'uploadDate'> = {
        subjectId: selectedSubjectId || subjects[0]?.id || 'general',
        title: fileName,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        pageCount: pageCount,
        extractedText: extractedText,
        summary: extractedText ? extractedText.slice(0, 220) + '...' : 'Uploaded document saved to library.',
        extractedKeyPoints: [
          'Document uploaded and indexed in Inbuilt Library.',
          `Extracted ${pageCount} pages/sections.`,
          'Available across ChatGPT / Gemini AI Tutor queries.',
        ],
        fileUrl: objectUrl,
      };

      const createdPdf = onAddPdf(newDoc);
      
      // Auto select the newly uploaded file
      if (createdPdf) {
        onSelectPdf(createdPdf);
      } else {
        // Fallback mock selected
        onSelectPdf({
          ...newDoc,
          id: `pdf_${Date.now()}`,
          uploadDate: 'Just now',
        });
      }

      onClose();
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err?.message || 'Failed to parse file. Saved to library as basic document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FBFBF9] w-full max-w-3xl rounded-3xl border border-[#EAE7E0] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#1A1A1A]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EAE7E0] bg-[#F6F4F0] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#1A1A1A] text-[#A68942] shadow-sm">
              <Sparkles className="w-5 h-5 text-[#A68942]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1A1A1A] tracking-tight">
                  {title}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#EAE7E0] text-[#A68942] text-[10px] font-bold uppercase tracking-wider">
                  ChatGPT/Gemini Style
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#EAE7E0] text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 border-b border-[#EAE7E0] bg-[#FBFBF9] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                activeTab === 'library'
                  ? 'border-[#A68942] text-[#1A1A1A] bg-[#F6F4F0]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-[#F6F4F0]/50'
              }`}
            >
              <Folder className="w-4 h-4 text-[#A68942]" />
              <span>Inbuilt File Library ({pdfs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('device')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                activeTab === 'device'
                  ? 'border-[#A68942] text-[#1A1A1A] bg-[#F6F4F0]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-[#F6F4F0]/50'
              }`}
            >
              <HardDrive className="w-4 h-4 text-[#A68942]" />
              <span>Upload from Device</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'library' ? (
            <div className="space-y-4">
              {/* Search & Subject Filter controls */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in your file library..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs text-[#1A1A1A] placeholder-zinc-400 focus:outline-none focus:border-[#A68942]"
                  />
                </div>

                <select
                  value={filterSubjectId}
                  onChange={(e) => setFilterSubjectId(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                >
                  <option value="all">All Subjects ({pdfs.length})</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              {/* List of Library Files */}
              {filteredPdfs.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {filteredPdfs.map((pdf) => {
                    const subject = subjects.find(s => s.id === pdf.subjectId);
                    return (
                      <div
                        key={pdf.id}
                        className="p-4 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] hover:border-[#A68942] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="p-2.5 rounded-xl bg-[#1A1A1A] text-[#A68942] shrink-0 mt-0.5">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-xs sm:text-sm text-[#1A1A1A] truncate group-hover:text-[#A68942] transition-colors">
                                {pdf.title}
                              </h4>
                              {subject && (
                                <span className="px-2 py-0.5 rounded-md bg-[#EAE7E0] text-zinc-700 text-[10px] font-bold">
                                  {subject.code}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 line-clamp-1">
                              {pdf.summary || pdf.extractedText?.slice(0, 120) || 'Uploaded document available'}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                              <span>{pdf.fileSize || '1.2 MB'}</span>
                              <span>•</span>
                              <span>{pdf.pageCount || 1} Pages</span>
                              <span>•</span>
                              <span>{pdf.uploadDate || 'Saved'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {onDeletePdf && (
                            <button
                              onClick={() => onDeletePdf(pdf.id)}
                              className="p-2 rounded-xl bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-[#EAE7E0] hover:border-rose-200 transition-colors"
                              title="Delete from Library"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onSelectPdf(pdf);
                              onClose();
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] text-xs font-semibold transition-all shadow-xs"
                          >
                            <span>{actionLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#A68942]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[#F6F4F0] border border-dashed border-[#EAE7E0] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#EAE7E0] text-zinc-500 flex items-center justify-center mx-auto">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A]">No Matching Files in Library</h3>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                      {searchQuery ? 'No documents match your search query.' : 'You haven\'t added any files to your library yet.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('device')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1A1A] text-[#FBFBF9] text-xs font-semibold shadow-xs"
                  >
                    <Upload className="w-4 h-4 text-[#A68942]" />
                    <span>Upload File from Device Now</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Device Upload Form */}
              <div className="p-4 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] space-y-3">
                <label className="block text-xs font-bold text-zinc-700">
                  Select Subject for New Document:
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`p-8 rounded-3xl border-2 border-dashed transition-all text-center cursor-pointer space-y-3 ${
                  isUploading 
                    ? 'bg-[#F6F4F0] border-[#A68942]' 
                    : 'bg-[#F6F4F0]/60 border-[#EAE7E0] hover:border-[#A68942] hover:bg-[#F6F4F0]'
                }`}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleDeviceFileUpload(e.target.files[0])}
                  accept={acceptFormats}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="space-y-3 py-4">
                    <Loader2 className="w-8 h-8 text-[#A68942] animate-spin mx-auto" />
                    <div>
                      <p className="font-bold text-sm text-[#1A1A1A]">Parsing & Indexing Document...</p>
                      <p className="text-xs text-zinc-500 mt-1">Extracting text and saving to your Inbuilt File Library</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] text-[#A68942] flex items-center justify-center mx-auto shadow-sm">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1A1A1A]">Click or Drag File to Upload from Device</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Supports PDF, PPT, PPTX, TXT, DOC, DOCX files
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#EAE7E0] text-zinc-700 text-[11px] font-semibold">
                      Automatically saved to Library for future AI sessions
                    </span>
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                  {uploadError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#EAE7E0] bg-[#F6F4F0] flex items-center justify-between gap-4 shrink-0">
          <p className="text-[11px] text-zinc-500 font-mono">
            SemOS Inbuilt Memory — {pdfs.length} files saved
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#EAE7E0] hover:bg-zinc-300 text-zinc-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
