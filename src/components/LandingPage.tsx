import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Terminal,
  Globe,
  Database,
  Layers,
  FileSpreadsheet,
  FileText,
  FileCode,
  Video,
  Shield,
  Eye,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Project, ContentItem } from '../types';
import { api } from '../services/api';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenGraphQL: () => void;
  onOpenDocs: () => void;
  onOpenContent: (slug: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenGraphQL,
  onOpenDocs,
  onOpenContent,
}) => {
  const [showcaseProjects, setShowcaseProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShowcase() {
      try {
        const data = await api.public.getShowcase();
        setShowcaseProjects(data);
      } catch (err) {
        console.error('Could not load public showcase', err);
      } finally {
        setLoading(false);
      }
    }
    loadShowcase();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full-Stack Content Infrastructure · FastAPI · SQLModel · Strawberry</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight text-balance">
              Unified hierarchy for Workspaces, Projects & Multi-Format Documents.
            </h1>

            <p className="text-base text-slate-400 max-w-2xl leading-relaxed">
              Enterprise content platform powered by Python FastAPI, SQLModel relational ORM, Strawberry GraphQL, JWT authentication, and browser-native viewers for Excel, Word, Markdown, Code, PDF, and Media.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onEnterApp}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 transition-all hover:translate-y-[-1px]"
              >
                <span>Launch Workspaces</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenGraphQL}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
              >
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Strawberry GraphQL IDE</span>
              </button>

              <button
                onClick={onOpenDocs}
                className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Docker & API Docs
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-400" />
                <span>SQLite Default · Postgres Ready</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>Public URLs /d/:slug</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Ownership RBAC</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl">
              <img
                src="/src/assets/images/hero_workspace_dashboard_1791186354521.jpg"
                alt="OmniSpace Studio Workspace"
                className="w-full h-80 object-cover object-center"
              />
              <div className="p-5 border-t border-slate-800/80 bg-slate-950/90 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Verified Core Engines</span>
                  <span className="text-emerald-400 font-mono">100% In-Browser</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-300">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                    Excel (.xlsx)
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                    Word (.docx)
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                    PDF & Video
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Architecture Matrix */}
      <section className="py-16 px-6 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Built on High-Performance Python & Modern Web
            </h2>
            <p className="text-xs text-slate-400">
              Zero compromises: typed SQLModel schemas map to Strawberry GraphQL queries and reactive frontends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Hierarchy & Ownership</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Workspaces contain isolated Projects, which in turn group multi-format Contents. Owners hold strict write permissions while public links allow guest inspection.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Native Document Viewers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Render Word (.docx) with typography layouts, Excel (.xlsx/.xls) with formula grid tabs, Markdown with live split previews, and HTML5 video streaming without external viewers.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Public Links /d/:slug</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Publish any document with one click. Readers can access custom slug URLs directly with no login, authentication barrier, or account requirement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Public Showcase Directory */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <span>Public Showcase Projects</span>
            </h2>
            <div className="text-xs text-slate-400 mt-1">
              Explore publicly published documents, spreadsheets, and specifications directly.
            </div>
          </div>
          <button
            onClick={onEnterApp}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Create Your Project</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading public showcase...</div>
        ) : showcaseProjects.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No public projects found. Log in to create and publish one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {showcaseProjects.map((proj) => (
              <div
                key={proj.id}
                className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                      {proj.workspaceTitle || 'Public Workspace'}
                    </span>
                    <h3 className="text-base font-semibold text-slate-100 mt-0.5">{proj.title}</h3>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">Public</span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{proj.description}</p>

                {/* Published Contents List */}
                {proj.contents && proj.contents.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Published Documents
                    </div>
                    <div className="divide-y divide-slate-800/50">
                      {proj.contents.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onOpenContent(item.slug)}
                          className="py-2 flex items-center justify-between text-xs text-slate-300 hover:text-indigo-300 cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {item.contentType === 'markdown' && <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                            {item.contentType === 'code' && <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            {item.contentType === 'excel' && <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            {item.contentType === 'word' && <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                            {item.contentType === 'video' && <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                            <span className="font-medium truncate">{item.title}</span>
                          </div>

                          <div className="flex items-center gap-3 text-slate-500 text-[11px] shrink-0 font-mono">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{item.viewCount}</span>
                            </span>
                            <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                              /d/{item.slug}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-8 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">OmniSpace</span>
            <span>·</span>
            <span>Full-stack Workspaces & Content Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenGraphQL} className="hover:text-slate-300 transition-colors">
              Strawberry GraphQL
            </button>
            <button onClick={onOpenDocs} className="hover:text-slate-300 transition-colors">
              Docker & API Specs
            </button>
            <button onClick={onEnterApp} className="hover:text-slate-300 transition-colors">
              App Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
