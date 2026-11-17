import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../lib/api';
import type { CollaborationProject, CollaborationRequest, ProjectMember } from '../types';

interface CollaborationDetailResponse {
  collaboration: CollaborationProject;
  members: ProjectMember[];
  my_request: CollaborationRequest | null;
  requests: CollaborationRequest[];
}

export function CollaborationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState<CollaborationDetailResponse | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<CollaborationDetailResponse>(`/api/collaborations/${id}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load collaboration project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [id]);

  const handleRequestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    setSubmitting(true);
    try {
      await apiRequest(`/api/collaborations/${id}/requests`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      setMessage('');
      setFeedback('Your collaboration request has been sent to the project owner.');
      await loadDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (requestId: number, status: 'accepted' | 'rejected') => {
    setError('');
    try {
      await apiRequest(`/api/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update request.');
    }
  };

  const isOwner = data && data.collaboration.owner_id === user?.id;
  const isMember = data && data.members.some((m) => m.user_id === user?.id);

  return (
    <AppShell
      breadcrumb={`Collaboration / ${data?.collaboration.title || 'Project Details'}`}
      action={
        <Link
          to="/collaborations"
          className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          Back to Hub
        </Link>
      }
    >
      {loading && <div className="h-56 bg-white border border-slate-200 rounded-xl animate-pulse" />}
      {error && (
        <div className="mb-4 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}
      {feedback && (
        <div className="mb-4 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
          {feedback}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              <p className="text-xs font-medium text-blue-700">
                {data.collaboration.category} · {data.collaboration.status} · Capacity{' '}
                <span className="tabular-nums">
                  {data.members.length}/{data.collaboration.team_size}
                </span>
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold text-slate-950">
                {data.collaboration.title}
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {data.collaboration.description}
              </p>

              <div className="mt-6 pt-5 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-500">Required Skills</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {data.collaboration.required_skills}
                </p>
              </div>
            </section>

            {/* Request to Join (non-owner, non-member) */}
            {!isOwner && !isMember && (
              <section className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-display text-lg font-semibold text-slate-950">
                  Request to Join Team
                </h2>

                {data.my_request ? (
                  <div className="mt-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">
                      Request status:{' '}
                      <span className="capitalize text-blue-700">{data.my_request.status}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{data.my_request.message}</p>
                  </div>
                ) : (
                  <form onSubmit={handleRequestJoin} className="mt-4 space-y-3">
                    <label htmlFor="join-note" className="block text-sm text-slate-700">
                      Describe the skills or role you can contribute (minimum 10 characters):
                    </label>
                    <textarea
                      id="join-note"
                      rows={3}
                      required
                      minLength={10}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="I have experience with React and Flask APIs and can help build the core dashboard..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2.5 rounded-lg bg-slate-950 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
                    >
                      {submitting ? 'Sending Request...' : 'Send Join Request'}
                    </button>
                  </form>
                )}
              </section>
            )}

            {/* Owner Request Moderation */}
            {isOwner && (
              <section className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold text-slate-950">
                    Incoming Join Requests ({data.requests.length})
                  </h2>
                  <Link
                    to="/collaboration-requests"
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Manage all requests →
                  </Link>
                </div>

                {data.requests.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No join requests received for this project yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {data.requests.map((req) => (
                      <div
                        key={req.id}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar
                            name={req.requester_name || 'Applicant'}
                            src={req.requester_avatar}
                            size="sm"
                          />
                          <div>
                            <Link
                              to={`/profile/${req.requester_id}`}
                              className="text-sm font-semibold text-slate-950 hover:text-blue-700"
                            >
                              {req.requester_name}
                            </Link>
                            <p className="text-xs text-slate-500">
                              {req.requester_category} · Status:{' '}
                              <span className="capitalize font-medium text-slate-800">
                                {req.status}
                              </span>
                            </p>
                            <p className="mt-1.5 text-sm text-slate-700">{req.message}</p>
                          </div>
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDecision(req.id, 'accepted')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(req.id, 'rejected')}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar: Owner & Approved Team Members */}
          <aside className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-base font-semibold text-slate-950 mb-4">
                Project Owner
              </h2>
              <div className="flex items-center gap-3">
                <Avatar
                  name={data.collaboration.owner_name}
                  src={data.collaboration.owner_avatar}
                  size="md"
                />
                <div className="min-w-0">
                  <Link
                    to={`/profile/${data.collaboration.owner_id}`}
                    className="text-sm font-semibold text-slate-950 hover:text-blue-700 block truncate"
                  >
                    {data.collaboration.owner_name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">
                    {data.collaboration.owner_category}
                    {data.collaboration.owner_is_demo ? ' · Demo' : ''}
                  </p>
                </div>
              </div>
              {data.collaboration.owner_headline && (
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                  {data.collaboration.owner_headline}
                </p>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-base font-semibold text-slate-950 mb-4 tabular-nums">
                Approved Team Members ({data.members.length})
              </h2>
              <ul className="divide-y divide-slate-100">
                {data.members.map((m) => (
                  <li key={m.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    <Avatar name={m.full_name} src={m.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <Link
                        to={`/profile/${m.user_id}`}
                        className="text-sm font-medium text-slate-950 hover:text-blue-700 block truncate"
                      >
                        {m.full_name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {m.role} · {m.category}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
