import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User as UserIcon,
  Award,
  BookOpen,
  Briefcase,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Inbox,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

interface AppShellProps {
  breadcrumb: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'My Profile', to: '/profile', icon: UserIcon },
  { label: 'Skills', to: '/skills', icon: Award },
  { label: 'Learning', to: '/learning', icon: BookOpen },
  { label: 'Progress', to: '/my-learning', icon: TrendingUp },
  { label: 'Portfolio', to: '/portfolio', icon: Briefcase },
  { label: 'Community', to: '/community', icon: MessageSquare },
  { label: 'Collaboration', to: '/collaborations', icon: Users },
  { label: 'Requests', to: '/collaboration-requests', icon: Inbox },
  { label: 'Settings', to: '/settings', icon: Settings },
] as const;

export function AppShell({ breadcrumb, action, children }: AppShellProps) {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/learning') {
      return location.pathname.startsWith('/learning');
    }
    if (path === '/collaborations') {
      return (
        location.pathname === '/collaborations' ||
        location.pathname.startsWith('/collaborations/')
      );
    }
    if (path === '/profile') {
      return location.pathname === '/profile' || location.pathname.startsWith('/profile/');
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B162C] text-slate-200">
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <Link
          to="/dashboard"
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap"
          onClick={() => setMobileOpen(false)}
        >
          SkillSphere
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav aria-label="Workspace Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
                active
                  ? 'bg-blue-700/25 text-white border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-300' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 space-y-3 shrink-0">
        {user && (
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <Avatar name={user.full_name} src={profile?.avatar_url} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-slate-400 truncate">
                {user.category}
                {user.is_demo ? ' · Demo' : ''}
              </p>
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-950 rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium text-slate-500 truncate">
              <span className="text-slate-900 font-semibold font-display">SkillSphere</span>
              <span className="mx-2 text-slate-300">/</span>
              <span className="text-slate-700">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">{action}</div>
        </header>

        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
