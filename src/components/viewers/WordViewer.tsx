import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, BookOpen } from 'lucide-react';
import mammoth from 'mammoth';

interface WordViewerProps {
  initialContent?: string;
  fileUrl?: string;
  fileName?: string;
}

export const WordViewer: React.FC<WordViewerProps> = ({
  initialContent,
  fileUrl,
  fileName = 'document.docx',
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function parseDocx() {
      setLoading(true);

      // 1. If fileUrl provided, try parsing with mammoth
      if (fileUrl && fileUrl.startsWith('/uploads/')) {
        try {
          const res = await fetch(fileUrl);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            if (result.value) {
              setHtmlContent(result.value);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Could not parse docx via mammoth, using formatted fallback', e);
        }
      }

      // 2. Format initialContent text into structured document HTML
      const raw = initialContent || `OmniSpace Document\n\nNo content available.`;
      const paragraphs = raw.split('\n\n');
      const formatted = paragraphs
        .map((p) => {
          const trimmed = p.trim();
          if (trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.')) {
            const lines = trimmed.split('\n');
            const title = lines[0];
            const rest = lines.slice(1).join('<br />');
            return `<h2 class="text-xl font-bold text-slate-900 mt-6 mb-2">${title}</h2><p class="text-slate-700 leading-relaxed mb-4">${rest}</p>`;
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const items = trimmed
              .split('\n')
              .map((li) => `<li class="my-1 text-slate-700">${li.replace(/^[-•]\s*/, '')}</li>`)
              .join('');
            return `<ul class="list-disc pl-5 my-4 space-y-1">${items}</ul>`;
          }
          if (trimmed.length < 80 && !trimmed.includes('.')) {
            return `<h1 class="text-2xl font-bold text-slate-900 mt-4 mb-4 pb-2 border-b border-slate-200">${trimmed}</h1>`;
          }
          return `<p class="text-slate-700 leading-relaxed mb-4 text-justify">${trimmed.replace(/\n/g, '<br />')}</p>`;
        })
        .join('');

      setHtmlContent(formatted);
      setLoading(false);
    }

    parseDocx();
  }, [initialContent, fileUrl]);

  const handlePrint = () => {
    window.print();
  };

  const wordCount = htmlContent.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-sans">
      {/* Top Document Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>{fileName}</span>
          </div>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">{wordCount} words</span>
          <span className="text-slate-600 text-xs">·</span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <BookOpen className="w-3 h-3 text-slate-500" />
            <span>{readTimeMin} min read</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Document Viewport with Paper Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/40 flex justify-center">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
            Rendering Word document...
          </div>
        ) : (
          <div className="w-full max-w-3xl bg-white text-slate-900 p-8 sm:p-14 rounded-lg shadow-xl border border-slate-200 min-h-[600px] select-text">
            <div
              className="prose prose-slate max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
