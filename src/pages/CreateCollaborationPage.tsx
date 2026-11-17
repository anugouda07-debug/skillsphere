import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { apiRequest, ApiError } from '../lib/api';
import type { CollaborationProject } from '../types';

const CATEGORIES = [
  'Web Development',
  'Data Science',
  'Artificial Intelligence',
  'Machine Learning',
  'Programming',
  'Design',
  'Business',
  'Entrepreneurship',
];

export function CreateCollaborationPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [teamSize, setTeamSize] = useState(4);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ collaboration: CollaborationProject }>(
        '/api/collaborations',
        {
          method: 'POST',
          body: JSON.stringify({
            title,
            category,
            required_skills: requiredSkills,
            team_size: teamSize,
            description,
          }),
        }
      );
      navigate(`/collaborations/${res.collaboration.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create collaboration project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      breadcrumb="Collaboration / New Project"
      action={
        <Link
          to="/collaborations"
          className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
        >
          Back to Hub
        </Link>
      }
    >
      <div className="max-w-[740px] bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <h1 className="font-display text-xl font-bold text-slate-950">
          Create Collaboration Project
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Describe the build scope, required skills, and ideal team size to invite collaborators.
        </p>

        {error && (
          <div className="mt-4 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Project title
            </label>
            <input
              type="text"
              required
              minLength={4}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. OpenMentor — Peer Code Review Scheduler"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Target team size
              </label>
              <input
                type="number"
                min={2}
                max={20}
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Required skills (comma-separated)
            </label>
            <input
              type="text"
              required
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder="React.js, Python, Flask REST APIs, UI/UX Architecture"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Project brief & milestones
            </label>
            <textarea
              rows={5}
              required
              minLength={20}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline what you are building, who it helps, and what roles you are looking for."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-slate-950 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Launch Collaboration Project'}
            </button>
            <Link
              to="/collaborations"
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
