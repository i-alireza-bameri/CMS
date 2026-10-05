import React from 'react';
import { LogOut, User as UserIcon, LogIn, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeView: 'landing' | 'app' | 'graphql' | 'docs' | 'public-share';
  onSelectView: (view: 'landing' | 'app' | 'graphql' | 'docs') => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onSelectView,
  onOpenAuth,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onSelectView('landing')}
        className="text-lg font-bold tracking-tight text-white hover:text-indigo-400 transition-colors flex items-center gap-2"
      >
        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
        <span>OmniSpace</span>
      </button>

      {/* Zone 2: 4-5 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
        <button
          onClick={() => onSelectView('landing')}
          className={`hover:text-slate-100 transition-colors ${
            activeView === 'landing' ? 'text-white font-semibold' : ''
          }`}
        >
          Public Hub
        </button>
        <button
          onClick={() => onSelectView('app')}
          className={`hover:text-slate-100 transition-colors ${
            activeView === 'app' ? 'text-white font-semibold' : ''
          }`}
        >
          Workspaces
        </button>
        <button
          onClick={() => onSelectView('graphql')}
          className={`hover:text-slate-100 transition-colors ${
            activeView === 'graphql' ? 'text-white font-semibold' : ''
          }`}
        >
          Strawberry GraphQL
        </button>
        <button
          onClick={() => onSelectView('docs')}
          className={`hover:text-slate-100 transition-colors ${
            activeView === 'docs' ? 'text-white font-semibold' : ''
          }`}
        >
          Architecture & Docker
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-xs text-indigo-300 font-semibold">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-medium text-slate-200">{user.fullName}</span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
