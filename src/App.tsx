import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  Video,
  Plus,
  Share2,
  Trash2,
  Eye,
  Radio,
  Menu,
  X,
  ExternalLink,
  Download,
  FolderOpen,
  Globe,
  Lock,
} from 'lucide-react';
import { User, Workspace, Project, ContentItem, ContentType } from './types';
import { api } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { PublicContentShare } from './components/PublicContentShare';
import { GraphQLExplorer } from './components/GraphQLExplorer';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { MarkdownViewer } from './components/viewers/MarkdownViewer';
import { CodeEditorViewer } from './components/viewers/CodeEditorViewer';
import { ExcelViewer } from './components/viewers/ExcelViewer';
import { WordViewer } from './components/viewers/WordViewer';
import { PdfViewer } from './components/viewers/PdfViewer';
import { ImageViewer } from './components/viewers/ImageViewer';
import { VideoPlayer } from './components/viewers/VideoPlayer';
import { AuthModal } from './components/modals/AuthModal';
import { WorkspaceModal } from './components/modals/WorkspaceModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { ContentModal } from './components/modals/ContentModal';
import { PublishModal } from './components/modals/PublishModal';

function MainApplication() {
  const { user } = useAuth();

  // Navigation views: 'landing' | 'app' | 'graphql' | 'docs' | 'public-share'
  const [activeView, setActiveView] = useState<'landing' | 'app' | 'graphql' | 'docs' | 'public-share'>('landing');
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  // Core Data State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [activeContent, setActiveContent] = useState<ContentItem | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishingContent, setPublishingContent] = useState<ContentItem | null>(null);

  // Mobile drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Detect URL on initial load and route changes: /d/:slug
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      if (path.startsWith('/d/')) {
        const slug = path.replace('/d/', '').split('/')[0];
        if (slug) {
          setPublicSlug(slug);
          setActiveView('public-share');
          return;
        }
      }
      if (window.location.hash.startsWith('#/d/')) {
        const slug = window.location.hash.replace('#/d/', '').split('/')[0];
        if (slug) {
          setPublicSlug(slug);
          setActiveView('public-share');
          return;
        }
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Load Workspaces on mount or when user changes
  const loadWorkspaces = async () => {
    try {
      const list = await api.workspaces.list();
      setWorkspaces(list);
      if (list.length > 0 && !activeWorkspace) {
        setActiveWorkspace(list[0]);
      }
    } catch (err) {
      console.error('Failed to load workspaces', err);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [user]);

  // Load Projects when active workspace changes
  useEffect(() => {
    if (!activeWorkspace) {
      setProjects([]);
      setActiveProject(null);
      return;
    }

    async function loadProjects() {
      if (!activeWorkspace) return;
      try {
        const list = await api.projects.list(activeWorkspace.id);
        setProjects(list);
        if (list.length > 0) {
          setActiveProject(list[0]);
        } else {
          setActiveProject(null);
          setContents([]);
          setActiveContent(null);
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    }
    loadProjects();
  }, [activeWorkspace]);

  // Load Contents when active project changes
  useEffect(() => {
    if (!activeProject) {
      setContents([]);
      setActiveContent(null);
      return;
    }

    async function loadContents() {
      if (!activeProject) return;
      try {
        const list = await api.contents.list(activeProject.id);
        setContents(list);
        if (list.length > 0) {
          setActiveContent(list[0]);
        } else {
          setActiveContent(null);
        }
      } catch (err) {
        console.error('Failed to load contents', err);
      }
    }
    loadContents();
  }, [activeProject]);

  // Public slug navigation handler
  const handleOpenPublicSlug = (slug: string) => {
    setPublicSlug(slug);
    setActiveView('public-share');
    window.history.pushState(null, '', `/d/${slug}`);
  };

  const handleNavigateHome = () => {
    setActiveView('landing');
    setPublicSlug(null);
    window.history.pushState(null, '', '/');
  };

  // Workspace CRUD handlers
  const handleCreateOrUpdateWorkspace = async (data: { title: string; description: string; isPublic: boolean }) => {
    if (editingWorkspace) {
      const updated = await api.workspaces.update(editingWorkspace.id, data);
      setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      if (activeWorkspace?.id === updated.id) setActiveWorkspace(updated);
    } else {
      const created = await api.workspaces.create(data);
      setWorkspaces((prev) => [...prev, created]);
      setActiveWorkspace(created);
    }
    setEditingWorkspace(null);
  };

  const handleDeleteWorkspace = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workspace and all associated projects?')) return;
    await api.workspaces.delete(id);
    const updated = workspaces.filter((w) => w.id !== id);
    setWorkspaces(updated);
    if (activeWorkspace?.id === id) {
      setActiveWorkspace(updated[0] || null);
    }
  };

  // Project CRUD handlers
  const handleCreateOrUpdateProject = async (data: { title: string; description: string; isPublished: boolean }) => {
    if (!activeWorkspace) return;
    if (editingProject) {
      const updated = await api.projects.update(editingProject.id, data);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (activeProject?.id === updated.id) setActiveProject(updated);
    } else {
      const created = await api.projects.create({
        workspaceId: activeWorkspace.id,
        ...data,
      });
      setProjects((prev) => [...prev, created]);
      setActiveProject(created);
    }
    setEditingProject(null);
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    await api.projects.delete(id);
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    if (activeProject?.id === id) {
      setActiveProject(updated[0] || null);
    }
  };

  // Content CRUD handlers
  const handleDeleteContent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content item?')) return;
    await api.contents.delete(id);
    const updated = contents.filter((c) => c.id !== id);
    setContents(updated);
    if (activeContent?.id === id) {
      setActiveContent(updated[0] || null);
    }
  };

  const handleSaveContentText = async (newText: string) => {
    if (!activeContent) return;
    const updated = await api.contents.update(activeContent.id, { textContent: newText });
    setContents((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActiveContent(updated);
  };

  // Helper icon by content type
  const renderTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'markdown':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'code':
        return <FileCode className="w-4 h-4 text-emerald-400" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'word':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'pdf':
        return <File className="w-4 h-4 text-rose-400" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-rose-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const isWsOwner = activeWorkspace && user && activeWorkspace.ownerId === user.id;

  // View: Public Share (/d/:slug)
  if (activeView === 'public-share' && publicSlug) {
    return <PublicContentShare slug={publicSlug} onNavigateHome={handleNavigateHome} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract (3 zones) */}
      <Navbar
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          if (v === 'landing') {
            window.history.pushState(null, '', '/');
          }
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content Router */}
      {activeView === 'landing' && (
        <LandingPage
          onEnterApp={() => setActiveView('app')}
          onOpenGraphQL={() => setActiveView('graphql')}
          onOpenDocs={() => setActiveView('docs')}
          onOpenContent={handleOpenPublicSlug}
        />
      )}

      {activeView === 'graphql' && <GraphQLExplorer />}

      {activeView === 'docs' && <ArchitectureDocs />}

      {activeView === 'app' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Mobile Sidebar Toggle Header on small screens */}
          <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300"
            >
              {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>{activeWorkspace?.title || 'Navigation'}</span>
            </button>
            <span className="text-xs text-slate-400 truncate">{activeProject?.title}</span>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden md:flex">
            <Sidebar
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={setActiveWorkspace}
              onOpenCreateWorkspace={() => {
                setEditingWorkspace(null);
                setWorkspaceModalOpen(true);
              }}
              onEditWorkspace={(ws) => {
                setEditingWorkspace(ws);
                setWorkspaceModalOpen(true);
              }}
              onDeleteWorkspace={handleDeleteWorkspace}
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProject}
              onOpenCreateProject={() => {
                setEditingProject(null);
                setProjectModalOpen(true);
              }}
              onEditProject={(proj) => {
                setEditingProject(proj);
                setProjectModalOpen(true);
              }}
              onDeleteProject={handleDeleteProject}
              currentUser={user}
            />
          </div>

          {/* Mobile Sidebar Drawer */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-40 md:hidden bg-slate-950/80 backdrop-blur-sm flex">
              <div className="w-72 bg-slate-950 h-full">
                <Sidebar
                  workspaces={workspaces}
                  activeWorkspace={activeWorkspace}
                  onSelectWorkspace={(ws) => {
                    setActiveWorkspace(ws);
                    setMobileSidebarOpen(false);
                  }}
                  onOpenCreateWorkspace={() => {
                    setEditingWorkspace(null);
                    setWorkspaceModalOpen(true);
                    setMobileSidebarOpen(false);
                  }}
                  onEditWorkspace={(ws) => {
                    setEditingWorkspace(ws);
                    setWorkspaceModalOpen(true);
                    setMobileSidebarOpen(false);
                  }}
                  onDeleteWorkspace={handleDeleteWorkspace}
                  projects={projects}
                  activeProject={activeProject}
                  onSelectProject={(proj) => {
                    setActiveProject(proj);
                    setMobileSidebarOpen(false);
                  }}
                  onOpenCreateProject={() => {
                    setEditingProject(null);
                    setProjectModalOpen(true);
                    setMobileSidebarOpen(false);
                  }}
                  onEditProject={(proj) => {
                    setEditingProject(proj);
                    setProjectModalOpen(true);
                    setMobileSidebarOpen(false);
                  }}
                  onDeleteProject={handleDeleteProject}
                  currentUser={user}
                />
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="flex-1 p-4 text-slate-400 flex justify-end items-start"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Center Column: Contents List inside Active Project */}
          <div className="w-80 border-r border-slate-800/80 bg-slate-950 flex flex-col shrink-0">
            {/* Project Header */}
            <div className="p-4 border-b border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {activeProject ? activeProject.title : 'No Project Selected'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {activeProject?.description || 'Select or create a project to manage content'}
                  </div>
                </div>

                {isWsOwner && activeProject && (
                  <button
                    onClick={() => setContentModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors shrink-0"
                    title="Add Content / Upload File"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              {/* Zero-Pill Unboxed Metadata */}
              {activeProject && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>{contents.length} documents</span>
                  <span>·</span>
                  <span className={activeProject.isPublished ? 'text-emerald-400' : 'text-slate-500'}>
                    {activeProject.isPublished ? 'Public Project' : 'Private Project'}
                  </span>
                </div>
              )}
            </div>

            {/* Contents List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
              {contents.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <FolderOpen className="w-8 h-8 text-slate-600 mx-auto stroke-1" />
                  <div className="text-xs text-slate-400">No documents in this project</div>
                  {isWsOwner && activeProject && (
                    <button
                      onClick={() => setContentModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-slate-900 border border-slate-800 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create First Document</span>
                    </button>
                  )}
                </div>
              ) : (
                contents.map((item) => {
                  const isSelected = activeContent?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveContent(item)}
                      className={`p-3 cursor-pointer transition-colors space-y-1.5 group ${
                        isSelected ? 'bg-slate-900/90 border-l-2 border-indigo-500' : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          {renderTypeIcon(item.contentType)}
                          <span
                            className={`text-xs font-medium truncate ${
                              isSelected ? 'text-slate-100 font-semibold' : 'text-slate-300'
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>

                        {item.isPublished && (
                          <span title="Published to /d/:slug" className="text-emerald-400 shrink-0">
                            <Radio className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* Unboxed Metadata without pill enclosures */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="capitalize">{item.contentType}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <Eye className="w-3 h-3 text-slate-600" />
                            <span>{item.viewCount}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.isPublished && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPublicSlug(item.slug);
                              }}
                              title="Open Public Link"
                              className="text-slate-400 hover:text-indigo-400"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isWsOwner && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPublishingContent(item);
                                  setPublishModalOpen(true);
                                }}
                                title="Share & Publish Settings"
                                className="text-slate-400 hover:text-emerald-400"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteContent(item.id);
                                }}
                                title="Delete Document"
                                className="text-slate-500 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Viewport: Active Document Viewer */}
          <main className="flex-1 flex flex-col bg-slate-950 p-4 md:p-6 overflow-hidden">
            {activeContent ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Active Content Top Bar */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3 truncate">
                    {renderTypeIcon(activeContent.contentType)}
                    <h2 className="text-base font-bold text-slate-100 truncate">{activeContent.title}</h2>
                    <span className="text-slate-600 text-xs">·</span>
                    <span className="text-xs text-slate-500 font-mono">
                      slug: <span className="text-slate-400">/d/{activeContent.slug}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {activeContent.fileUrl && (
                      <a
                        href={api.files.getDownloadUrl(activeContent.id)}
                        download={activeContent.fileName || 'document'}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setPublishingContent(activeContent);
                        setPublishModalOpen(true);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        activeContent.isPublished
                          ? 'bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{activeContent.isPublished ? 'Published (/d/:slug)' : 'Publish & Share'}</span>
                    </button>
                  </div>
                </div>

                {/* Specialized Format Viewer */}
                <div className="flex-1 overflow-hidden">
                  {activeContent.contentType === 'markdown' && (
                    <MarkdownViewer
                      initialContent={activeContent.textContent || ''}
                      onSave={handleSaveContentText}
                      readOnly={!isWsOwner}
                    />
                  )}

                  {activeContent.contentType === 'code' && (
                    <CodeEditorViewer
                      initialCode={activeContent.textContent || ''}
                      fileName={activeContent.fileName || `${activeContent.slug}.py`}
                      onSave={handleSaveContentText}
                      readOnly={!isWsOwner}
                    />
                  )}

                  {activeContent.contentType === 'excel' && (
                    <ExcelViewer
                      initialContent={activeContent.textContent}
                      fileUrl={activeContent.fileUrl}
                      fileName={activeContent.fileName || 'spreadsheet.xlsx'}
                    />
                  )}

                  {activeContent.contentType === 'word' && (
                    <WordViewer
                      initialContent={activeContent.textContent}
                      fileUrl={activeContent.fileUrl}
                      fileName={activeContent.fileName || 'document.docx'}
                    />
                  )}

                  {activeContent.contentType === 'pdf' && (
                    <PdfViewer
                      fileUrl={activeContent.fileUrl}
                      fileName={activeContent.fileName || 'document.pdf'}
                      initialContent={activeContent.textContent}
                    />
                  )}

                  {activeContent.contentType === 'image' && (
                    <ImageViewer
                      src={activeContent.fileUrl || '/src/assets/images/hero_workspace_dashboard_1791186354521.jpg'}
                      fileName={activeContent.fileName || 'image.jpg'}
                      fileSize={activeContent.fileSize}
                    />
                  )}

                  {activeContent.contentType === 'video' && (
                    <VideoPlayer
                      src={
                        activeContent.fileUrl ||
                        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                      }
                      fileName={activeContent.fileName || 'recording.mp4'}
                    />
                  )}

                  {activeContent.contentType === 'text' && (
                    <CodeEditorViewer
                      initialCode={activeContent.textContent || ''}
                      fileName={activeContent.fileName || 'note.txt'}
                      language="plaintext"
                      onSave={handleSaveContentText}
                      readOnly={!isWsOwner}
                    />
                  )}

                  {activeContent.contentType === 'file' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
                      <File className="w-12 h-12 text-slate-500" />
                      <div>
                        <h3 className="text-base font-semibold text-slate-200">
                          {activeContent.fileName || 'Uploaded Binary File'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          File size: {((activeContent.fileSize || 0) / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      {activeContent.fileUrl && (
                        <a
                          href={api.files.getDownloadUrl(activeContent.id)}
                          download={activeContent.fileName || 'download'}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Stored File</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs space-y-3">
                <FolderOpen className="w-10 h-10 stroke-1" />
                <span>Select a document from the left list or create a new one</span>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <WorkspaceModal
        isOpen={workspaceModalOpen}
        onClose={() => {
          setWorkspaceModalOpen(false);
          setEditingWorkspace(null);
        }}
        onSubmit={handleCreateOrUpdateWorkspace}
        initialData={editingWorkspace}
      />

      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleCreateOrUpdateProject}
        initialData={editingProject}
        workspaceTitle={activeWorkspace?.title}
      />

      {activeProject && (
        <ContentModal
          isOpen={contentModalOpen}
          onClose={() => setContentModalOpen(false)}
          projectId={activeProject.id}
          projectTitle={activeProject.title}
          onSuccess={(newContent) => {
            setContents((prev) => [newContent, ...prev]);
            setActiveContent(newContent);
          }}
        />
      )}

      {publishingContent && (
        <PublishModal
          isOpen={publishModalOpen}
          onClose={() => {
            setPublishModalOpen(false);
            setPublishingContent(null);
          }}
          content={publishingContent}
          onUpdated={(updated) => {
            setContents((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            if (activeContent?.id === updated.id) setActiveContent(updated);
          }}
          onOpenPublic={handleOpenPublicSlug}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}
