import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  const navLinkClass = (path: string) =>
    `whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-950 ${
      location.pathname === path
        ? 'text-slate-950 underline underline-offset-4 decoration-blue-700'
        : 'text-slate-600'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
          >
            SkillSphere
          </Link>

          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            <Link to="/about" className={navLinkClass('/about')}>
              About
            </Link>
            <Link to="/learning" className={navLinkClass('/learning')}>
              Roadmaps
            </Link>
            <Link to="/community" className={navLinkClass('/community')}>
              Community
            </Link>
            <Link
              to={user ? '/collaborations' : '/login'}
              className={navLinkClass(user ? '/collaborations' : '/login')}
            >
              {user ? 'Collaborate' : 'Sign In'}
            </Link>
          </nav>

          <div className="flex items-center shrink-0">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-950 hover:bg-blue-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              {user ? 'Open Dashboard' : 'Get Started'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
        <div className="max-w-[1200px] mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <p className="font-display text-lg font-bold text-white">SkillSphere</p>
            <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
              Learn. Connect. Create. Grow. A global skill development, verified project
              portfolio, knowledge exchange, and collaboration platform.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200 mb-3">Platform</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About SkillSphere
                </Link>
              </li>
              <li>
                <Link to="/learning" className="hover:text-white transition-colors">
                  Learning Roadmaps
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-white transition-colors">
                  Knowledge Community
                </Link>
              </li>
              <li>
                <Link to="/collaborations" className="hover:text-white transition-colors">
                  Collaboration Hub
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200 mb-3">Account</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Member Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800/80">
          <div className="max-w-[1200px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} SkillSphere. All rights reserved.</span>
            <span>Students · Graduates · Professionals · Entrepreneurs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
