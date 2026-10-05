import React, { useState } from 'react';
import { Image as ImageIcon, ZoomIn, ZoomOut, Download, Maximize } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  fileName?: string;
  fileSize?: number;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt = 'Image preview',
  fileName = 'image.jpg',
  fileSize = 0,
}) => {
  const [zoom, setZoom] = useState(100);

  const formatSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-sans">
      {/* Image Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span>{fileName}</span>
          </div>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">{formatSize(fileSize)}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(z - 25, 25))}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-xs text-slate-300 font-mono tabular-nums">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(z + 25, 300))}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-white border-l border-slate-800 font-mono"
            >
              Fit
            </button>
          </div>

          <a
            href={src}
            download={fileName}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Image Canvas with Transparent Checkerboard Pattern */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transition: 'transform 0.15s ease-out',
          }}
          className="max-w-full max-h-full rounded-lg overflow-hidden shadow-2xl border border-slate-800 bg-slate-900"
        >
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            className="max-w-none object-contain select-none"
            onError={(e) => {
              // Zero broken image policy fallback
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
};
