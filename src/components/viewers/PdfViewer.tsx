import React, { useState } from 'react';
import { FileText, ZoomIn, ZoomOut, Download, Maximize2, RotateCw } from 'lucide-react';

interface PdfViewerProps {
  fileUrl?: string;
  fileName?: string;
  initialContent?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  fileUrl,
  fileName = 'document.pdf',
  initialContent,
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-sans">
      {/* PDF Controls Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
            <FileText className="w-4 h-4 text-red-400" />
            <span>{fileName}</span>
          </div>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-slate-400 font-mono">PDF Document</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-xs text-slate-300 font-mono tabular-nums">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleRotate}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
            title="Rotate Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {fileUrl && (
            <a
              href={fileUrl}
              download={fileName}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-900/40 flex justify-center items-start">
        {fileUrl ? (
          <div
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-out',
            }}
            className="w-full max-w-4xl h-[750px] shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white"
          >
            <iframe
              src={`${fileUrl}#toolbar=0`}
              title={fileName}
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
            }}
            className="w-full max-w-3xl min-h-[600px] bg-white text-slate-900 p-12 rounded-lg shadow-xl border border-slate-200"
          >
            <div className="border-b border-slate-200 pb-4 mb-6">
              <div className="text-xs uppercase tracking-widest text-slate-400 font-mono">OmniSpace Verified PDF</div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">{fileName.replace('.pdf', '')}</h1>
            </div>
            <div className="prose prose-slate text-sm leading-relaxed text-slate-700">
              <p>
                {initialContent ||
                  'This document preview simulates PDF layout rendering. When uploading an actual .pdf file, the system embeds the raw byte stream into an interactive canvas.'}
              </p>
              <div className="my-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-900 text-xs uppercase mb-2">Document Metadata</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>Format: Adobe PDF 1.7</div>
                  <div>Security: Encrypted (SHA-256)</div>
                  <div>Page Count: 1 of 1</div>
                  <div>Status: Production Certified</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
