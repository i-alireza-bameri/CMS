import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Eye, Globe, Share2, Check, FileText, ExternalLink } from 'lucide-react';
import { ContentItem } from '../types';
import { api } from '../services/api';
import { MarkdownViewer } from './viewers/MarkdownViewer';
import { CodeEditorViewer } from './viewers/CodeEditorViewer';
import { ExcelViewer } from './viewers/ExcelViewer';
import { WordViewer } from './viewers/WordViewer';
import { PdfViewer } from './viewers/PdfViewer';
import { ImageViewer } from './viewers/ImageViewer';
import { VideoPlayer } from './viewers/VideoPlayer';

interface PublicContentShareProps {
  slug: string;
  onNavigateHome: () => void;
}

export const PublicContentShare: React.FC<PublicContentShareProps> = ({
  slug,
  onNavigateHome,
}) => {
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchPublic() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.public.getContentBySlug(slug);
        setContent(data);
      } catch (err: any) {
        setError(err.message || 'Public content not found or unpublished');
      } finally {
        setLoading(false);
      }
    }
    fetchPublic();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Retrieving shared content...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200 px-4">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
          <Globe className="w-12 h-12 text-slate-500 mx-auto" />
          <h1 className="text-xl font-bold">Content Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The document at <span className="font-mono text-indigo-400">/d/{slug}</span> does not exist or has been made private by its owner.
          </p>
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to OmniSpace Home</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract (3 zones) */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>OmniSpace Hub</span>
          </button>
          <span className="text-slate-700 text-xs">/</span>
          <span className="text-xs font-semibold text-slate-300 truncate max-w-xs">{content.title}</span>
        </div>

        {/* Zone 2: Metadata without pills */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
          <span>Published Document</span>
          <span>·</span>
          <span>{formatDate(content.updatedAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1 font-mono tabular-nums">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>{content.viewCount} views</span>
          </span>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>

          {content.fileUrl && (
            <a
              href={api.files.getDownloadUrl(content.id)}
              download={content.fileName || 'download'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          )}

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
          >
            <span>Launch App</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Content Canvas */}
      <main className="flex-1 p-4 md:p-6 flex flex-col max-w-7xl w-full mx-auto">
        <div className="flex-1 min-h-[600px]">
          {content.contentType === 'markdown' && (
            <MarkdownViewer initialContent={content.textContent || ''} readOnly={true} />
          )}

          {content.contentType === 'code' && (
            <CodeEditorViewer
              initialCode={content.textContent || ''}
              fileName={content.fileName || `${content.slug}.py`}
              readOnly={true}
            />
          )}

          {content.contentType === 'excel' && (
            <ExcelViewer
              initialContent={content.textContent}
              fileUrl={content.fileUrl}
              fileName={content.fileName || 'spreadsheet.xlsx'}
            />
          )}

          {content.contentType === 'word' && (
            <WordViewer
              initialContent={content.textContent}
              fileUrl={content.fileUrl}
              fileName={content.fileName || 'document.docx'}
            />
          )}

          {content.contentType === 'pdf' && (
            <PdfViewer
              fileUrl={content.fileUrl}
              fileName={content.fileName || 'document.pdf'}
              initialContent={content.textContent}
            />
          )}

          {content.contentType === 'image' && (
            <ImageViewer
              src={content.fileUrl || '/src/assets/images/hero_workspace_dashboard_1791186354521.jpg'}
              fileName={content.fileName || 'image.jpg'}
              fileSize={content.fileSize}
            />
          )}

          {content.contentType === 'video' && (
            <VideoPlayer
              src={content.fileUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
              fileName={content.fileName || 'recording.mp4'}
            />
          )}

          {content.contentType === 'text' && (
            <CodeEditorViewer
              initialCode={content.textContent || ''}
              fileName={content.fileName || 'note.txt'}
              language="plaintext"
              readOnly={true}
            />
          )}
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-600">
        <span>OmniSpace Open Document Network</span>
        <span className="mx-2">·</span>
        <span>Public share slug: <span className="font-mono text-slate-500">{content.slug}</span></span>
      </footer>
    </div>
  );
};
