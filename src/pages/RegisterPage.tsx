import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import type { UserCategory } from '../types';

const CATEGORIES: Array<{ value: UserCategory; label: string; desc: string }> = [
  { value: 'Student', label: 'Student', desc: 'Learning core skills & building first projects' },
  { value: 'Graduate', label: 'Graduate', desc: 'Growing portfolio proof & real team experience' },
  { value: 'Professional', label: 'Working Professional', desc: 'Upgrading skills & mentoring peers' },
  { value: 'Entrepreneur', label: 'Entrepreneur', desc: 'Sharing venture ideas & recruiting builders' },
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<UserCategory>('Student');
  const [headline, setHeadline] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        category,
        headline,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-[680px] mx-auto px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <h1 className="font-display text-2xl font-bold text-slate-950">
            Create your SkillSphere account
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Select your profile category to personalize your dashboard and collaboration feed.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <span className="block text-sm font-medium text-slate-800 mb-2">
                Select your category
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((item) => {
                  const selected = category === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCategory(item.value)}
                      className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                        selected
                          ? 'border-blue-700 bg-blue-50/60'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Full name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jordan Lee"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Email address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-headline"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Short headline (optional)
              </label>
              <input
                id="reg-headline"
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. CS Student exploring Python & Web Architecture"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Password (minimum 8 characters)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-950 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-medium text-blue-700 hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
