import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { apiRequest, ApiError } from '../lib/api';
import type { CollaborationRequest } from '../types';

export function CollaborationRequestsPage() {
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<CollaborationRequest[]>([]);
  const [outgoing, setOutgoing] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{
        incoming: CollaborationRequest[];
        outgoing: CollaborationRequest[];
      }>('/api/requests');
      setIncoming(res.incoming);
      setOutgoing(res.outgoing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const handleDecision = async (reqId: number, status: 'accepted' | 'rejected') => {
    setError('');
    try {
      await apiRequest(`/api/requests/${reqId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadRequests();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update request.');
    }
  };

  return (
    <AppShell
      breadcrumb="Collaboration Requests"
      action={
        <Link
          to="/collaborations"
          className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          Browse Projects
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950">
              Collaboration Requests
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review applicants for projects you own and track your sent applications.
            </p>
          </div>

          <div className="flex items-center p-1 bg-slate-200/70 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setTab('incoming')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                tab === 'incoming' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
              }`}
            >
              Incoming ({incoming.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('outgoing')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                tab === 'outgoing' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
              }`}
            >
              Sent ({outgoing.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
        ) : tab === 'incoming' ? (
          incoming.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm text-slate-600">
                You have not received any collaboration join requests yet.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {incoming.map((req) => (
                <div
                  key={req.id}
                  className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={req.requester_name || 'Applicant'}
                      src={req.requester_avatar}
                      size="md"
                    />
                    <div>
                      <p className="text-xs text-slate-500">
                        Project:{' '}
                        <Link
                          to={`/collaborations/${req.collaboration_id}`}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          {req.project_title}
                        </Link>{' '}
                        · Status: <span className="capitalize font-medium">{req.status}</span>
                      </p>
                      <Link
                        to={`/profile/${req.requester_id}`}
                        className="mt-1 block text-base font-semibold text-slate-950 hover:text-blue-700"
                      >
                        {req.requester_name} ({req.requester_category})
                      </Link>
                      <p className="mt-1.5 text-sm text-slate-700">{req.message}</p>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDecision(req.id, 'accepted')}
                        className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                      >
                        Accept Member
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(req.id, 'rejected')}
                        className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : outgoing.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm text-slate-600">
              You have not applied to join any collaboration projects yet.
            </p>
            <Link
              to="/collaborations"
              className="mt-4 inline-block px-4 py-2 rounded-lg bg-slate-950 text-white text-xs font-semibold"
            >
              Browse Collaboration Hub
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
            {outgoing.map((req) => (
              <div
                key={req.id}
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-slate-500">
                    {req.project_category} · Owner: {req.owner_name} ({req.owner_category})
                  </p>
                  <Link
                    to={`/collaborations/${req.collaboration_id}`}
                    className="mt-1 block font-display text-base font-semibold text-slate-950 hover:text-blue-700"
                  >
                    {req.project_title}
                  </Link>
                  <p className="mt-1.5 text-sm text-slate-600">{req.message}</p>
                </div>

                <span
                  className={`text-xs font-semibold capitalize shrink-0 ${
                    req.status === 'accepted'
                      ? 'text-emerald-700'
                      : req.status === 'rejected'
                        ? 'text-red-700'
                        : 'text-amber-700'
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
