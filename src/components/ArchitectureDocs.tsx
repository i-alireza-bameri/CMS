import React, { useState } from 'react';
import { BookOpen, Terminal, Database, Server, Copy, Check, ShieldCheck } from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-950 font-sans text-slate-200">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Architecture & Deployment Guide</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            FastAPI, SQLModel, SQLite & Strawberry GraphQL Stack
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            OmniSpace is engineered with strict separation of concerns, providing both REST CRUD endpoints and typed Strawberry GraphQL queries backed by SQLModel ORM.
          </p>
        </div>

        {/* 1. Quick Docker Start */}
        <section className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>1. Run with Docker Compose</span>
            </h2>
            <button
              onClick={() => copyCode('docker', 'docker compose up --build -d')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
            >
              {copiedKey === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Builds and starts both the FastAPI backend (port 8000) and the Vite/Nginx frontend (port 3000):
          </p>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
{`# Build and launch all services in detached mode
docker compose up --build -d

# Frontend: http://localhost:3000
# Backend OpenAPI / Swagger: http://localhost:8000/docs
# Strawberry GraphQL IDE: http://localhost:8000/graphql`}
          </pre>
        </section>

        {/* 2. SQLite Default & Easy PostgreSQL Swap */}
        <section className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>2. Database Configuration: SQLite vs PostgreSQL</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            By default, OmniSpace connects to a local, zero-setup SQLite database file. To scale to PostgreSQL in production, update <span className="font-mono text-indigo-400">DATABASE_URL</span> in your environment or <span className="font-mono text-indigo-400">docker-compose.yml</span>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-xs font-semibold text-slate-200">Default (SQLite)</div>
              <div className="text-[11px] font-mono text-emerald-400 break-all">
                DATABASE_URL="sqlite:///./omnispace.db"
              </div>
              <div className="text-[11px] text-slate-500">
                Zero configuration required. Tables automatically provision on boot.
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-xs font-semibold text-slate-200">Production (PostgreSQL)</div>
              <div className="text-[11px] font-mono text-indigo-400 break-all">
                DATABASE_URL="postgresql+psycopg2://user:pass@host:5432/omnispace"
              </div>
              <div className="text-[11px] text-slate-500">
                Uncomment the postgres block in docker-compose.yml.
              </div>
            </div>
          </div>
        </section>

        {/* 3. Relational Hierarchy & Ownership Rules */}
        <section className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span>3. Relational Hierarchy & Ownership Access</span>
          </h2>
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              • <strong>Workspaces:</strong> Top-level organization unit. Created and owned by users. Workspaces can be private (only accessible to owner) or public.
            </p>
            <p>
              • <strong>Projects:</strong> Nested inside workspaces. Inherit the workspace authorization boundary. Can be flagged as public showcase items.
            </p>
            <p>
              • <strong>Contents:</strong> Multi-format items (Word docx, Excel xlsx, Markdown, Code, PDF, Media). Publishing a content item generates a unique slug accessible via <span className="font-mono text-indigo-400">/d/:slug</span> with zero authentication required.
            </p>
          </div>
        </section>

        {/* 4. Local Python FastAPI Setup */}
        <section className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <span>4. Local Python Virtual Environment</span>
            </h2>
            <button
              onClick={() =>
                copyCode(
                  'python',
                  'cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --port 8000 --reload'
                )
              }
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
            >
              {copiedKey === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

pip install -r requirements.txt

# Run FastAPI with hot-reloading
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`}
          </pre>
        </section>
      </div>
    </div>
  );
};
