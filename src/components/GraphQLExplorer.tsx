import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, Sparkles, BookOpen, Clock } from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_QUERIES = [
  {
    name: 'Get Current User (me)',
    query: `query GetCurrentUser {
  me {
    id
    email
    fullName
    role
    createdAt
  }
}`,
  },
  {
    name: 'Workspaces & Projects Tree',
    query: `query ListWorkspacesWithTree {
  workspaces {
    id
    title
    slug
    isPublic
    projects {
      id
      title
      slug
      isPublished
      contents {
        id
        title
        slug
        contentType
        isPublished
        viewCount
      }
    }
  }
}`,
  },
  {
    name: 'Public Content by Slug',
    query: `query FetchPublicContent {
  publicContent(slug: "system-architecture-rfc") {
    id
    title
    slug
    contentType
    textContent
    isPublished
    viewCount
    updatedAt
  }
}`,
  },
  {
    name: 'Mutation: Create Workspace',
    query: `mutation CreateNewWorkspace {
  createWorkspace(
    title: "Autonomous Fleet Robotics"
    description: "Firmware builds and telemetry pipelines"
    isPublic: true
  ) {
    id
    title
    slug
  }
}`,
  },
];

export const GraphQLExplorer: React.FC = () => {
  const [query, setQuery] = useState(SAMPLE_QUERIES[1].query);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'schema'>('editor');

  const handleRunQuery = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await api.graphql(query);
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setResponse(res);
    } catch (err: any) {
      setResponse({ errors: [{ message: err.message }] });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h1 className="text-base font-bold text-slate-100">Strawberry GraphQL Explorer</h1>
          </div>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-slate-400 font-mono">POST /graphql</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg mr-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive IDE
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'schema' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Python Schema
            </button>
          </div>

          <button
            onClick={handleRunQuery}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{loading ? 'Executing...' : 'Execute Query'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'schema' ? (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
              <h2 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Strawberry GraphQL Schema Definition (backend/app/schema.py)</span>
              </h2>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Strawberry maps Python dataclasses directly into GraphQL types, seamlessly connecting with SQLModel ORM models and FastAPI context.
              </p>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
{`import strawberry
from typing import Optional, List
from datetime import datetime

@strawberry.type
class ContentType:
    id: int
    projectId: int
    title: str
    slug: str
    contentType: str
    textContent: Optional[str]
    isPublished: bool
    viewCount: int

@strawberry.type
class ProjectType:
    id: int
    workspaceId: int
    title: str
    slug: str
    isPublished: bool
    contents: List[ContentType]

@strawberry.type
class WorkspaceType:
    id: int
    title: str
    slug: str
    isPublic: bool
    ownerId: int
    projects: List[ProjectType]

@strawberry.type
class Query:
    me: Optional[UserType]
    workspaces: List[WorkspaceType]
    publicContent(slug: str): Optional[ContentType]

schema = strawberry.Schema(query=Query, mutation=Mutation)`}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Query Editor Pane */}
          <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-slate-800">
            {/* Quick Templates Bar */}
            <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/50 border-b border-slate-800 overflow-x-auto">
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider shrink-0 mr-1">
                Templates:
              </span>
              {SAMPLE_QUERIES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(item.query)}
                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap"
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="flex-1 p-4 bg-slate-950">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter GraphQL query or mutation..."
                className="w-full h-full bg-transparent text-indigo-300 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-0 selection:bg-indigo-600/40"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Response Viewer Pane */}
          <div className="w-full md:w-1/2 flex flex-col bg-slate-950">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Response Payload</span>
                {latencyMs !== null && (
                  <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono tabular-nums">
                    <Clock className="w-3 h-3" />
                    <span>{latencyMs}ms</span>
                  </div>
                )}
              </div>

              {response && (
                <button
                  onClick={handleCopyResponse}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 p-4 overflow-auto">
              {response ? (
                <pre className="text-xs font-mono text-slate-200 leading-relaxed">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs">
                  <Terminal className="w-8 h-8 mb-2 stroke-1" />
                  <span>Execute a query to inspect live JSON output</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
