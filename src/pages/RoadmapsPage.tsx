import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { PublicLayout } from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import type { RoadmapSummary } from '../types';

const ROADMAP_CATEGORIES = [
  'All',
  'Web Development',
  'Data Science',
  'Artificial Intelligence',
  'Entrepreneurship',
  'Design',
];

export function RoadmapsPage() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadRoadmaps = async (qStr = query, catStr = category) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (qStr) params.set('q', qStr);
      if (catStr !== 'All') params.set('category', catStr);
      const data = await apiRequest<{ roadmaps: RoadmapSummary[] }>(
        `/api/roadmaps?${params.toString()}`
      );
      setRoadmaps(data.roadmaps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoadmaps(query, category);
  }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadRoadmaps(query, category);
  };

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-950">Learning Roadmaps</h1>
          <p className="mt-1 text-sm text-slate-600">
            Structured multi-step pathways with curated resources and persistent progress tracking.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roadmaps..."
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
        {ROADMAP_CATEGORIES.map((cat) => (
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
          <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
          <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-600">No learning roadmaps matched your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roadmaps.map((rm) => (
            <div
              key={rm.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs text-slate-500">
                  {rm.category} · {rm.difficulty} · {rm.estimated_hours} hrs ·{' '}
                  <span className="tabular-nums">{rm.total_steps} steps</span>
                </p>
                <h2 className="mt-2 font-display text-lg font-semibold text-slate-950">
                  {rm.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{rm.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                {user && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 tabular-nums">
                      <span>
                        {rm.completed_steps} of {rm.total_steps} completed
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {rm.progress_percent}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-700 transition-all"
                        style={{ width: `${rm.progress_percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <Link
                  to={`/learning/${rm.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  <span>{user ? 'Open Roadmap & Track Steps' : 'Inspect Curriculum'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (user) {
    return (
      <AppShell
        breadcrumb="Learning Roadmaps"
        action={
          <Link
            to="/my-learning"
            className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
          >
            My Learning Progress
          </Link>
        }
      >
        {content}
      </AppShell>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-[1200px] mx-auto px-6 py-12">{content}</div>
    </PublicLayout>
  );
}
