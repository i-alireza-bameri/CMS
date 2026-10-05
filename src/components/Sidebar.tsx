import React, { useState } from 'react';
import {
  Briefcase,
  ChevronDown,
  Plus,
  Folder,
  FolderOpen,
  Globe,
  Lock,
  MoreVertical,
  Trash2,
  Edit2,
  Radio,
} from 'lucide-react';
import { Workspace, Project, User } from '../types';

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onSelectWorkspace: (ws: Workspace) => void;
  onOpenCreateWorkspace: () => void;
  onEditWorkspace: (ws: Workspace) => void;
  onDeleteWorkspace: (id: number) => void;

  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (proj: Project) => void;
  onOpenCreateProject: () => void;
  onEditProject: (proj: Project) => void;
  onDeleteProject: (id: number) => void;

  currentUser: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  projects,
  activeProject,
  onSelectProject,
  onOpenCreateProject,
  onEditProject,
  onDeleteProject,
  currentUser,
}) => {
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isWsOwner = activeWorkspace && currentUser && activeWorkspace.ownerId === currentUser.id;

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950 flex flex-col h-full font-sans select-none shrink-0">
      {/* Workspace Switcher */}
      <div className="p-3 border-b border-slate-800/80 relative">
        <button
          onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-100 truncate">
                {activeWorkspace ? activeWorkspace.title : 'Select Workspace'}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                {activeWorkspace?.isPublic ? (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>Public</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>Private</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        </button>

        {/* Dropdown Menu */}
        {wsDropdownOpen && (
          <div className="absolute left-3 right-3 top-16 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
              Workspaces
            </div>
            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    onSelectWorkspace(ws);
                    setWsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    activeWorkspace?.id === ws.id
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{ws.title}</span>
                  {ws.isPublic && <Globe className="w-3 h-3 opacity-60 ml-1 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-1 mt-1">
              <button
                onClick={() => {
                  setWsDropdownOpen(false);
                  onOpenCreateWorkspace();
                }}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/80 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Projects Hierarchy Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Projects
        </span>
        {isWsOwner && (
          <button
            onClick={onOpenCreateProject}
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-900 rounded transition-colors"
            title="Add Project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Projects Tree List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {projects.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-500">
            No projects in this workspace yet.
          </div>
        ) : (
          projects.map((proj) => {
            const isSelected = activeProject?.id === proj.id;
            return (
              <div
                key={proj.id}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors relative ${
                  isSelected
                    ? 'bg-slate-900 text-white font-medium border border-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
                onClick={() => onSelectProject(proj)}
              >
                <div className="flex items-center gap-2 truncate">
                  {isSelected ? (
                    <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">{proj.title}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {proj.isPublished && (
                    <span title="Published to public" className="text-emerald-400">
                      <Radio className="w-3 h-3" />
                    </span>
                  )}

                  {isWsOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === `proj-${proj.id}` ? null : `proj-${proj.id}`);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-300 rounded"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Project Context Menu */}
                {activeMenuId === `proj-${proj.id}` && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-8 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1 z-30 space-y-0.5 text-xs w-32"
                  >
                    <button
                      onClick={() => {
                        setActiveMenuId(null);
                        onEditProject(proj);
                      }}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-slate-300 hover:bg-slate-800 text-left"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenuId(null);
                        onDeleteProject(proj.id);
                      }}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-rose-400 hover:bg-rose-950/40 text-left"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Workspace Footer Actions if Owner */}
      {isWsOwner && activeWorkspace && (
        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => onEditWorkspace(activeWorkspace)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            <span>Workspace Settings</span>
          </button>
          <button
            onClick={() => onDeleteWorkspace(activeWorkspace.id)}
            className="text-slate-500 hover:text-rose-400 transition-colors"
            title="Delete Workspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
};
