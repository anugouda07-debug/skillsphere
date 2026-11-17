import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

const DEMO_ACCOUNTS = [
  {
    name: 'Aarav Mehta',
    role: 'Student',
    email: 'aarav.student@skillsphere.demo',
    focus: 'Full-Stack Systems & Campus Projects',
  },
  {
    name: 'Elena Rostova',
    role: 'Graduate',
    email: 'elena.grad@skillsphere.demo',
    focus: 'Applied Data Science & Forecasting',
  },
  {
    name: 'Marcus Vance',
    role: 'Professional',
    email: 'marcus.pro@skillsphere.demo',
    focus: 'Backend Architecture & Mentorship',
  },
  {
    name: 'Priya Nair',
    role: 'Entrepreneur',
    email: 'priya.founder@skillsphere.demo',
    focus: 'CivicLearn Venture & Team Building',
  },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string) => {
    setError('');
    setEmail(demoEmail);
    setPassword('DemoPass123!');
    setSubmitting(true);
    try {
      await login(demoEmail, 'DemoPass123!');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Demo sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-[1000px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-8">
          <h1 className="font-display text-2xl font-bold text-slate-950">Sign in to SkillSphere</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Access your dashboard, learning roadmaps, portfolio, and collaboration teams.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-800 mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-950 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            New to SkillSphere?{' '}
            <Link to="/register" className="font-medium text-blue-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-8">
          <h2 className="font-display text-lg font-semibold text-slate-950">
            Demonstration Accounts
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Seeded sample profiles are clearly marked as demonstration records and separated from
            newly registered users. Click any persona below to sign in immediately.
          </p>

          <div className="mt-5 divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {DEMO_ACCOUNTS.map((demo) => (
              <div
                key={demo.email}
                className="p-4 bg-white flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    {demo.name}{' '}
                    <span className="font-normal text-slate-500">· {demo.role} · Demo</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">{demo.focus}</p>
                  <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">{demo.email}</p>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoSignIn(demo.email)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 hover:border-blue-700 hover:text-blue-700 text-xs font-semibold text-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Use Demo
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500 font-mono">
            Demo password: DemoPass123!
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
