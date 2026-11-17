import React, { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../lib/api';
import type { UserCategory } from '../types';

export function SettingsPage() {
  const { user, refreshAuth, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [category, setCategory] = useState<UserCategory>(user?.category || 'Student');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await apiRequest('/api/auth/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName,
          category,
          ...(newPassword
            ? { current_password: currentPassword, new_password: newPassword }
            : {}),
        }),
      });
      await refreshAuth();
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Account settings updated successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell breadcrumb="Account Settings">
      <div className="max-w-[680px] space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <h1 className="font-display text-xl font-bold text-slate-950">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your account category, display name, and password security.
          </p>

          {user && (
            <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
              <span>
                Signed in as <strong className="text-slate-900">{user.email}</strong>
              </span>
              <span>{user.is_demo ? 'Demonstration Account' : 'Standard Member Account'}</span>
            </div>
          )}

          {message && (
            <div className="mt-4 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSaveAccount} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  Display name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  Member category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as UserCategory)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <option value="Student">Student</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Professional">Professional</option>
                  <option value="Entrepreneur">Entrepreneur</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h2 className="font-display text-base font-semibold text-slate-950">
                Change Password (optional)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required to set new password"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    New password
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-slate-950 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {saving ? 'Updating...' : 'Save Account Settings'}
              </button>

              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
