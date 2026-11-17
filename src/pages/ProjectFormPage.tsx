import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { apiRequest, ApiError } from '../lib/api';
import type { PortfolioProject } from '../types';

const PRESET_THUMBNAILS = [
  {
    label: 'Software Architecture Workspace',
    url: '/src/assets/images/project_ai_study_planner_1794909897619.jpg',
  },
  {
    label: 'Data & Product Roadmap Display',
    url: '/src/assets/images/project_fintech_ledger_1794909898484.jpg',
  },
];

export function ProjectFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState(PRESET_THUMBNAILS[0].url);
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    apiRequest<{ project: PortfolioProject }>(`/api/projects/${id}`)
      .then((res) => {
        const p = res.project;
        setTitle(p.title);
        setSummary(p.summary || '');
        setDescription(p.description);
        setTechnologies(p.technologies || '');
        setThumbnailUrl(p.thumbnail_url || '');
        setGithubUrl(p.github_url || '');
        setLiveUrl(p.live_url || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load project.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        title,
        summary,
        description,
        technologies,
        thumbnail_url: thumbnailUrl,
        github_url: githubUrl,
        live_url: liveUrl,
      };
      if (isEdit) {
        await apiRequest(`/api/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        navigate(`/portfolio/${id}`);
      } else {
        const res = await apiRequest<{ project: PortfolioProject }>('/api/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        navigate(`/portfolio/${res.project.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      breadcrumb={isEdit ? 'Portfolio / Edit Project' : 'Portfolio / Add Project'}
      action={
        <Link
          to="/portfolio"
          className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
        >
          Back to Portfolio
        </Link>
      }
    >
      <div className="max-w-[760px] bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <h1 className="font-display text-xl font-bold text-slate-950">
          {isEdit ? 'Edit Portfolio Project' : 'Add Portfolio Project'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Share the problem solved, architecture, tech stack, and links to code or live demo.
        </p>

        {error && (
          <div className="mt-4 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-56 bg-slate-50 rounded-lg animate-pulse" />
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Project title
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. PulseGrid — Adaptive Study & Milestone Planner"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                One-line summary
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief outcome-focused headline"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Full project description
              </label>
              <textarea
                rows={5}
                required
                minLength={15}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain architecture choices, challenges solved, and measurable results."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Technologies used (comma-separated)
              </label>
              <input
                type="text"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                placeholder="React, TypeScript, Python Flask, MySQL, Tailwind CSS"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Thumbnail image URL or preset
              </label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://... or select preset below"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_THUMBNAILS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setThumbnailUrl(preset.url)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      thumbnailUrl === preset.url
                        ? 'border-blue-700 bg-blue-50 text-blue-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  GitHub repository URL
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  Live project URL
                </label>
                <input
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-slate-950 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
              >
                {saving ? 'Saving...' : isEdit ? 'Save Project Changes' : 'Publish Project'}
              </button>
              <Link
                to="/portfolio"
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
