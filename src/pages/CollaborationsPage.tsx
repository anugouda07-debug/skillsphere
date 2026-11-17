import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { apiRequest } from '../lib/api';
import type { CollaborationProject } from '../types';

const COLLAB_CATEGORIES = [
  'All',
  'Web Development',
  'Data Science',
  'Artificial Intelligence',
  'Programming',
  'Design',
  'Entrepreneurship',
];

export function CollaborationsPage() {
  const [projects, setProjects] = useState<CollaborationProject[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadCollaborations = async (qStr = query, catStr = category, stStr = status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (qStr) params.set('q', qStr);
      if (catStr !== 'All') params.set('category', catStr);
      if (stStr !== 'All') params.set('status', stStr);
      const res = await apiRequest<{ collaborations: CollaborationProject[] }>(
        `/api/collaborations?${params.toString()}`
      );
      setProjects(res.collaborations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCollaborations(query, category, status);
  }, [category, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadCollaborations(query, category, status);
  };

  return (
    <AppShell
      breadcrumb="Collaboration Hub"
      action={
        <div className="flex items-center gap-2">
          <Link
            to="/collaboration-requests"
            className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
          >
            Requests
          </Link>
          <Link
            to="/collaborations/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-xs font-semibold whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950">Collaboration Hub</h1>
            <p className="mt-1 text-sm text-slate-600">
              Join active product builds matched to your skills or assemble a team for your idea.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title or skills..."
                className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-950 text-white text-xs font-semibold cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COLLAB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                category === cat
                  ? 'bg-slate-950 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-52 bg-white border border-slate-200 rounded-xl animate-pulse" />
            <div className="h-52 bg-white border border-slate-200 rounded-xl animate-pulse" />
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm text-slate-600">No collaboration projects matched your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((col) => (
              <article
                key={col.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs text-slate-500">
                    {col.category} ·{' '}
                    <span
                      className={
                        col.status === 'Open' ? 'text-emerald-700 font-medium' : 'text-slate-700'
                      }
                    >
                      {col.status}
                    </span>{' '}
                    · Led by {col.owner_name} ({col.owner_category}
                    {col.owner_is_demo ? ' · Demo' : ''})
                  </p>
                  <Link
                    to={`/collaborations/${col.id}`}
                    className="mt-2 block font-display text-lg font-semibold text-slate-950 hover:text-blue-700"
                  >
                    {col.title}
                  </Link>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {col.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Required skills:</span>{' '}
                    {col.required_skills}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 tabular-nums">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {col.member_count ?? 1} / {col.team_size} team members
                      </span>
                    </span>
                    <Link
                      to={`/collaborations/${col.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      View & Join
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
