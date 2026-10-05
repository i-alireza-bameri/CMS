import React, { useState } from 'react';
import { Eye, Code, Columns, Save, Check, Copy } from 'lucide-react';

interface MarkdownViewerProps {
  initialContent: string;
  onSave?: (newContent: string) => Promise<void>;
  readOnly?: boolean;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  initialContent,
  onSave,
  readOnly = false,
}) => {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'preview' | 'edit' | 'split'>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(content);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple clean markdown parser for headings, lists, bold, code, quotes, tables, and links
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLang = '';
    let tableBuffer: string[] = [];

    const flushTable = (key: string) => {
      if (tableBuffer.length === 0) return null;
      const rows = tableBuffer.map((r) =>
        r
          .split('|')
          .map((c) => c.trim())
          .filter((_c, i, arr) => (i === 0 && arr.length > 1 ? true : true))
          .filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''))
      );
      tableBuffer = [];

      if (rows.length < 2) return null;
      const headers = rows[0];
      const dataRows = rows.slice(2); // Skip separator row

      return (
        <div key={key} className="overflow-x-auto my-4 border border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                {headers.map((h, hi) => (
                  <th key={hi} className="px-4 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dataRows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-900/40 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2 text-slate-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    lines.forEach((line, index) => {
      // Code fence toggle
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          if (tableBuffer.length > 0) {
            elements.push(flushTable(`tbl-${index}`));
          }
          inCodeBlock = true;
          codeLang = line.trim().slice(3).trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <div key={`code-${index}`} className="my-4 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
              {codeLang && (
                <div className="px-4 py-1.5 bg-slate-900/80 text-xs font-mono text-slate-400 border-b border-slate-800">
                  {codeLang}
                </div>
              )}
              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                {codeBuffer.join('\n')}
              </pre>
            </div>
          );
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Table lines
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        tableBuffer.push(line.trim());
        return;
      } else if (tableBuffer.length > 0) {
        elements.push(flushTable(`tbl-${index}`));
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-2xl font-bold text-slate-100 mt-6 mb-3 pb-2 border-b border-slate-800 tracking-tight">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-xl font-semibold text-slate-100 mt-5 mb-2.5 tracking-tight">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-base font-semibold text-slate-200 mt-4 mb-2">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        const checked = line.startsWith('- [x] ');
        elements.push(
          <div key={index} className="flex items-center gap-2.5 my-1.5 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-default"
            />
            <span className={checked ? 'line-through text-slate-500' : ''}>{line.slice(6)}</span>
          </div>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={index} className="ml-4 list-disc text-sm text-slate-300 my-1 leading-relaxed">
            {parseInline(line.slice(2))}
          </li>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={index} className="border-l-2 border-indigo-500 pl-4 py-1 my-3 text-sm italic text-slate-400 bg-indigo-950/20 rounded-r">
            {parseInline(line.slice(2))}
          </blockquote>
        );
      } else if (line.trim() === '---') {
        elements.push(<hr key={index} className="my-6 border-slate-800" />);
      } else if (line.trim() === '') {
        elements.push(<div key={index} className="h-3" />);
      } else {
        elements.push(
          <p key={index} className="text-sm text-slate-300 leading-relaxed my-2">
            {parseInline(line)}
          </p>
        );
      }
    });

    if (tableBuffer.length > 0) {
      elements.push(flushTable('tbl-end'));
    }

    return elements;
  };

  const parseInline = (text: string) => {
    // Replace inline code `code`
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-900 text-indigo-300 font-mono text-xs border border-slate-800">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
      {/* Viewer Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-1.5 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
          {!readOnly && (
            <>
              <button
                onClick={() => setMode('edit')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === 'edit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Source</span>
              </button>
              <button
                onClick={() => setMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
            </>
          )}
          <button
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{charCount} chars</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {!readOnly && onSave && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        {mode !== 'preview' && !readOnly && (
          <div className={`flex-1 flex flex-col border-r border-slate-800/80 ${mode === 'edit' ? 'w-full' : 'w-1/2'}`}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write Markdown document here..."
              className="w-full h-full p-6 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-0 selection:bg-indigo-600/40"
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview Pane */}
        {mode !== 'edit' && (
          <div className={`flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/60 ${mode === 'preview' ? 'w-full max-w-4xl mx-auto' : 'w-1/2'}`}>
            <div className="prose prose-invert max-w-none">{renderMarkdown(content)}</div>
          </div>
        )}
      </div>
    </div>
  );
};
