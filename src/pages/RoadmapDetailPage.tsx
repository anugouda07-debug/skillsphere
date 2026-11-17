import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, ExternalLink, Plus } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { PublicLayout } from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../lib/api';
import type { RoadmapStep, RoadmapSummary } from '../types';

interface RoadmapDetailResponse {
  roadmap: RoadmapSummary;
  steps: RoadmapStep[];
  total_steps: number;
  completed_steps: number;
  progress_percent: number;
}

export function RoadmapDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState<RoadmapDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Add learning resource / step
  const [showAddStep, setShowAddStep] = useState(false);
  const [stepTitle, setStepTitle] = useState('');
  const [stepDesc, setStepDesc] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [savingStep, setSavingStep] = useState(false);

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<RoadmapDetailResponse>(`/api/roadmaps/${id}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoadmap();
  }, [id]);

  const handleToggleStep = async (step: RoadmapStep) => {
    if (!user) return;
    setTogglingId(step.id);
    const nextStatus = step.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await apiRequest<{
        step_id: number;
        status: 'pending' | 'completed';
        completed_steps: number;
        total_steps: number;
        progress_percent: number;
      }>('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ step_id: step.id, status: nextStatus }),
      });

      setData((prev) =>
        prev
          ? {
              ...prev,
              completed_steps: res.completed_steps,
              total_steps: res.total_steps,
              progress_percent: res.progress_percent,
              steps: prev.steps.map((s) =>
                s.id === step.id ? { ...s, status: res.status } : s
              ),
            }
          : prev
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update step status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavingStep(true);
    try {
      await apiRequest(`/api/roadmaps/${id}/steps`, {
        method: 'POST',
        body: JSON.stringify({
          title: stepTitle,
          description: stepDesc,
          resource_title: resourceTitle,
          resource_url: resourceUrl,
          estimated_minutes: estimatedMinutes,
        }),
      });
      setStepTitle('');
      setStepDesc('');
      setResourceTitle('');
      setResourceUrl('');
      setShowAddStep(false);
      await loadRoadmap();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add learning resource.');
    } finally {
      setSavingStep(false);
    }
  };

  const inner = (
    <div className="space-y-6">
      {loading && <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />}
      {error && (
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}

      {data && (
        <>
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <p className="text-xs font-medium text-blue-700">
                  {data.roadmap.category} · {data.roadmap.difficulty} · {data.roadmap.estimated_hours}{' '}
                  hours estimated
                </p>
                <h1 className="mt-2 font-display text-2xl font-bold text-slate-950">
                  {data.roadmap.title}
                </h1>
                <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {data.roadmap.description}
                </p>
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={() => setShowAddStep((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:border-blue-700 text-xs font-semibold text-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Learning Resource</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-slate-950 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Sign In to Track Progress
                </Link>
              )}
            </div>

            {user && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2 tabular-nums">
                  <span>
                    Progress: {data.completed_steps} of {data.total_steps} steps completed
                  </span>
                  <span className="font-mono font-semibold text-slate-950">
                    {data.progress_percent}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-700 transition-all"
                    style={{ width: `${data.progress_percent}%` }}
                  />
                </div>
              </div>
            )}
          </section>

          {showAddStep && user && (
            <form
              onSubmit={handleAddStep}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <h2 className="font-display text-base font-semibold text-slate-950">
                Add Learning Step & Resource
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Step title
                  </label>
                  <input
                    type="text"
                    required
                    value={stepTitle}
                    onChange={(e) => setStepTitle(e.target.value)}
                    placeholder="e.g. Indexing Strategies for Multi-Column Queries"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Est. minutes
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={360}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={stepDesc}
                  onChange={(e) => setStepDesc(e.target.value)}
                  placeholder="What the learner should study or build in this step"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Resource title
                  </label>
                  <input
                    type="text"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    placeholder="e.g. Official Guide / Article"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Resource URL
                  </label>
                  <input
                    type="url"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingStep}
                  className="px-4 py-2 rounded-lg bg-slate-950 text-white text-xs font-semibold cursor-pointer"
                >
                  {savingStep ? 'Adding...' : 'Add to Roadmap'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStep(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <section className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
            {data.steps.map((step, index) => {
              const done = step.status === 'completed';
              return (
                <div
                  key={step.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      disabled={!user || togglingId === step.id}
                      onClick={() => handleToggleStep(step)}
                      aria-label={
                        done ? `Mark ${step.title} as pending` : `Mark ${step.title} as completed`
                      }
                      className={`mt-0.5 shrink-0 transition-colors ${
                        user ? 'cursor-pointer' : 'cursor-default opacity-50'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-blue-700" />
                      )}
                    </button>

                    <div>
                      <p className="text-xs text-slate-500 tabular-nums">
                        Step {String(index + 1).padStart(2, '0')} · {step.estimated_minutes} min ·{' '}
                        <span className={done ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                          {done ? 'Completed' : 'Pending'}
                        </span>
                      </p>
                      <h3 className="mt-1 font-display text-base font-semibold text-slate-950">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                        {step.description}
                      </p>

                      {step.resource_url && (
                        <a
                          href={step.resource_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
                        >
                          <span>{step.resource_title || 'Open Learning Resource'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {user && (
                    <button
                      type="button"
                      disabled={togglingId === step.id}
                      onClick={() => handleToggleStep(step)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        done
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-950 text-white hover:bg-blue-800'
                      }`}
                    >
                      {done ? 'Completed' : 'Mark Complete'}
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );

  if (user) {
    return (
      <AppShell
        breadcrumb={`Learning / ${data?.roadmap.title || 'Roadmap'}`}
        action={
          <Link
            to="/learning"
            className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            All Roadmaps
          </Link>
        }
      >
        {inner}
      </AppShell>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-[1000px] mx-auto px-6 py-12">{inner}</div>
    </PublicLayout>
  );
}
