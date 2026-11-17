import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ExternalLink, Trash2, Edit3 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../lib/api';
import type { PortfolioProject } from '../types';

export function PortfolioPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProjects = async (sc = scope, qStr = query) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ scope: sc });
      if (qStr) params.set('q', qStr);
      const res = await apiRequest<{ projects: PortfolioProject[] }>(
        `/api/projects?${params.toString()}`
      );
      setProjects(res.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load portfolio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects(scope, query);
  }, [scope]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadProjects(scope, query);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete project.');
    }
  };

  return (
    <AppShell
      breadcrumb="Portfolio"
      action={
        <Link
          to="/portfolio/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950">Project Portfolio</h1>
            <p className="mt-1 text-sm text-slate-600">
              Document real engineering builds, tech stacks, repositories, and live deployments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 bg-slate-200/70 rounded-lg">
              <button
                type="button"
                onClick={() => setScope('mine')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  scope === 'mine' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                }`}
              >
                My Portfolio
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  scope === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                }`}
              >
                All Members
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by title or stack..."
                  className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold cursor-pointer"
              >
                Filter
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
            <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm text-slate-600">
              {scope === 'mine'
                ? 'You have not published any projects in your portfolio yet.'
                : 'No portfolio projects matched your search.'}
            </p>
            {scope === 'mine' && (
              <Link
                to="/portfolio/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-950 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish First Project</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => {
              const isOwner = proj.user_id === user?.id;
              return (
                <article
                  key={proj.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <Link to={`/portfolio/${proj.id}`} className="block h-44 bg-slate-100 border-b border-slate-200">
                      <ImageWithFallback
                        src={proj.thumbnail_url}
                        alt={proj.title}
                        className="w-full h-full object-cover"
                        fallbackTitle={proj.title}
                      />
                    </Link>

                    <div className="p-6">
                      <p className="text-xs text-slate-500 truncate">
                        {proj.technologies || 'General Software Build'}
                        {scope === 'all' && proj.owner_name
                          ? ` · By ${proj.owner_name} (${proj.owner_category})`
                          : ''}
                      </p>
                      <Link
                        to={`/portfolio/${proj.id}`}
                        className="mt-1.5 block font-display text-lg font-semibold text-slate-950 hover:text-blue-700"
                      >
                        {proj.title}
                      </Link>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                        {proj.summary || proj.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs font-medium text-blue-700">
                      <Link to={`/portfolio/${proj.id}`} className="hover:underline">
                        View Details
                      </Link>
                      {proj.github_url && (
                        <a
                          href={proj.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <span>GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {proj.live_url && (
                        <a
                          href={proj.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Live Demo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/portfolio/${proj.id}/edit`}
                          aria-label={`Edit ${proj.title}`}
                          className="p-1.5 text-slate-500 hover:text-slate-950 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(proj.id)}
                          aria-label={`Delete ${proj.title}`}
                          className="p-1.5 text-slate-500 hover:text-red-700 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
