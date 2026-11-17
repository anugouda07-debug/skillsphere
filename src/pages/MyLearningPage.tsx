import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { apiRequest } from '../lib/api';

interface ProgressPayload {
  summary: {
    total_completed_steps: number;
    total_pending_steps: number;
    active_roadmaps: number;
    overall_percent: number;
  };
  pathways: Array<{
    id: number;
    title: string;
    category: string;
    difficulty: string;
    estimated_hours: number;
    total_steps: number;
    completed_steps: number;
    pending_steps: number;
    progress_percent: number;
    steps: Array<{
      id: number;
      title: string;
      step_order: number;
      estimated_minutes: number;
      status: 'pending' | 'completed';
    }>;
  }>;
}

export function MyLearningPage() {
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<ProgressPayload>('/api/progress')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell
      breadcrumb="My Learning Progress"
      action={
        <Link
          to="/learning"
          className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-xs font-semibold whitespace-nowrap"
        >
          Browse Roadmaps
        </Link>
      }
    >
      {loading && <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />}

      {data && (
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950">My Learning Progress</h1>
            <p className="mt-1 text-sm text-slate-600">
              Track completed and pending steps across every skill pathway.
            </p>
          </div>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Overall Completion</p>
              <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
                {data.summary.overall_percent}%
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Completed Steps</p>
              <p className="mt-2 font-display text-2xl font-bold text-emerald-700 tabular-nums">
                {data.summary.total_completed_steps}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Pending Steps</p>
              <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
                {data.summary.total_pending_steps}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Active Pathways</p>
              <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
                {data.summary.active_roadmaps}
              </p>
            </div>
          </section>

          <section className="space-y-5">
            {data.pathways.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      {p.category} · {p.difficulty} · {p.estimated_hours} hrs
                    </p>
                    <Link
                      to={`/learning/${p.id}`}
                      className="mt-1 block font-display text-lg font-semibold text-slate-950 hover:text-blue-700"
                    >
                      {p.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-xs text-slate-700 tabular-nums">
                      {p.completed_steps}/{p.total_steps} ({p.progress_percent}%)
                    </span>
                    <Link
                      to={`/learning/${p.id}`}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:border-blue-700 text-xs font-semibold text-slate-800 whitespace-nowrap"
                    >
                      Open Steps
                    </Link>
                  </div>
                </div>

                <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-700"
                    style={{ width: `${p.progress_percent}%` }}
                  />
                </div>

                <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {p.steps.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-2.5 text-xs text-slate-700 py-1"
                    >
                      {s.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className={s.status === 'completed' ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                        {s.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      )}
    </AppShell>
  );
}
