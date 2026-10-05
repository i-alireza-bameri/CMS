import React, { useState } from 'react';
import { X, FilePlus, Upload, FileText, Code, Table, FileSpreadsheet, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import { ContentType, ContentItem } from '../../types';
import { api } from '../../services/api';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectTitle: string;
  onSuccess: (newContent: ContentItem) => void;
}

export const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'create' | 'upload'>('create');
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('markdown');
  const [textContent, setTextContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [slug, setSlug] = useState('');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'upload') {
        if (!selectedFile) {
          throw new Error('Please select a file to upload');
        }
        const res = await api.files.upload(selectedFile, projectId, title, isPublished);
        onSuccess(res.content);
      } else {
        if (!title.trim()) {
          throw new Error('Title is required');
        }
        const res = await api.contents.create({
          projectId,
          title,
          contentType,
          textContent,
          slug: slug.trim() || undefined,
          isPublished,
        });
        onSuccess(res);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-indigo-400" />
              <span>Add Content to "{projectTitle}"</span>
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Supports Markdown, Code, Excel (.xlsx), Word (.docx), PDF, Video & Images
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'create' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Create In-Browser</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'upload' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload File (.docx, .xlsx, .pdf, media)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'upload' ? (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  dragActive ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
                }`}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".md,.txt,.py,.ts,.tsx,.js,.json,.sql,.html,.css,.xlsx,.xls,.docx,.pdf,.png,.jpg,.jpeg,.webp,.svg,.mp4,.webm"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-sm font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click or drag file to upload'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : 'PDF, DOCX, XLSX, MP4, PNG, JPG, MD, Code & TXT files'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Document Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Architecture Blueprint"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Content Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. System RFC or Model Parameters"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Content Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'markdown', label: 'Markdown', icon: FileText },
                    { id: 'code', label: 'Source Code', icon: Code },
                    { id: 'excel', label: 'Spreadsheet', icon: FileSpreadsheet },
                    { id: 'word', label: 'Word Document', icon: FileText },
                    { id: 'text', label: 'Plain Text', icon: FileText },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setContentType(item.id as ContentType)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-colors ${
                        contentType === item.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0 text-indigo-400" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {contentType === 'code' ? 'Source Code Body' : 'Text / Markdown Content'}
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={6}
                  placeholder={
                    contentType === 'code'
                      ? 'def handler(event):\n    return {"status": 200}'
                      : '# Overview\n\nEnter markdown notes here...'
                  }
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Custom Public Slug (Optional)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-800 text-slate-400 text-xs border border-r-0 border-slate-800 rounded-l-lg font-mono">
                    /d/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-shareable-document"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-r-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Publishing toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/50 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <div className="text-xs">
                <span className="font-medium text-slate-200">Publish immediately to public URL</span>
                <span className="text-slate-400 block mt-0.5">
                  Allows direct access via /d/:slug without requiring a user login.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
            >
              {loading ? 'Processing...' : tab === 'upload' ? 'Upload File' : 'Create Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
