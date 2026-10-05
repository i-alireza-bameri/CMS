import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Play } from 'lucide-react';

interface CodeEditorViewerProps {
  initialCode: string;
  language?: string;
  fileName?: string;
  onSave?: (newCode: string) => Promise<void>;
  readOnly?: boolean;
}

export const CodeEditorViewer: React.FC<CodeEditorViewerProps> = ({
  initialCode,
  language = 'python',
  fileName = 'code.py',
  onSave,
  readOnly = false,
}) => {
  const [code, setCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(code);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono">
      {/* Code Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>{fileName}</span>
          </div>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-slate-400 font-mono">{language}</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-slate-500 tabular-nums">{lines.length} lines</span>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isSaving}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isEditing ? (isSaving ? 'Saving...' : 'Done Editing') : 'Edit Code'}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Editor & Line Numbers */}
      <div className="flex-1 flex overflow-auto text-xs leading-6 selection:bg-indigo-900/60 selection:text-white">
        {/* Line Numbers Gutter */}
        <div className="py-4 pl-4 pr-3 text-right text-slate-600 select-none bg-slate-950 border-r border-slate-900 tabular-nums font-mono min-w-[3.5rem]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 overflow-x-auto">
          {isEditing ? (
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full bg-transparent text-emerald-300 font-mono text-xs leading-6 resize-none focus:outline-none"
              spellCheck={false}
            />
          ) : (
            <pre className="font-mono text-xs leading-6 text-slate-200">
              <code>
                {lines.map((line, idx) => {
                  // Basic regex colorization for keywords, strings, comments
                  const isComment = line.trim().startsWith('#') || line.trim().startsWith('//');
                  return (
                    <div
                      key={idx}
                      className={
                        isComment
                          ? 'text-slate-500 italic'
                          : line.includes('def ') || line.includes('class ') || line.includes('import ') || line.includes('from ')
                          ? 'text-indigo-400 font-medium'
                          : line.includes('return ') || line.includes('if ') || line.includes('else:')
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }
                    >
                      {line || '\n'}
                    </div>
                  );
                })}
              </code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
