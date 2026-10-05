import React, { useState } from 'react';
import { X, Globe, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { ContentItem } from '../../types';
import { api } from '../../services/api';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem;
  onUpdated: (updated: ContentItem) => void;
  onOpenPublic: (slug: string) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  content,
  onUpdated,
  onOpenPublic,
}) => {
  const [isPublished, setIsPublished] = useState(content.isPublished);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/d/${content.slug}`;

  const handleTogglePublish = async () => {
    setLoading(true);
    try {
      const updated = await api.contents.togglePublish(content.id, !isPublished);
      setIsPublished(updated.isPublished);
      onUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">Publish & Share Content</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Box */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isPublished ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span>{isPublished ? 'Currently Published to Public' : 'Currently Private'}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {isPublished
                  ? 'Anyone with the link can view without authentication.'
                  : 'Only authorized workspace members can access this content.'}
              </div>
            </div>

            <button
              onClick={handleTogglePublish}
              disabled={loading}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-sm ${
                isPublished
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {loading ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish Now'}
            </button>
          </div>

          {/* Shareable Link Box */}
          {isPublished && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Public Shareable Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 select-all focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public route /d/:slug requires zero login</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPublic(content.slug);
                  }}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <span>Open Public Page</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
