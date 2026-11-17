import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Edit3, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../lib/api';
import type { PortfolioProject } from '../types';

export function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<PortfolioProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ project: PortfolioProject }>(`/api/projects/${id}`)
      .then((res) => setProject(res.project))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load project.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    try {
      await apiRequest(`/api/projects/${id}`, { method: 'DELETE' });
      navigate('/portfolio');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete project.');
    }
  };

  const isOwner = project && project.user_id === user?.id;

  return (
    <AppShell
      breadcrumb={`Portfolio / ${project?.title || 'Project Details'}`}
      action={
        <Link
          to="/portfolio"
          className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          Back to Portfolio
        </Link>
      }
    >
      {loading && <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}

      {project && (
        <div className="space-y-6">
          <article className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="h-64 sm:h-80 bg-slate-100 border-b border-slate-200">
              <ImageWithFallback
                src={project.thumbnail_url}
                alt={project.title}
                className="w-full h-full object-cover"
                fallbackTitle={project.title}
              />
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-700">
                    {project.technologies || 'Software Project'}
                  </p>
                  <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-slate-950">
                    {project.title}
                  </h1>
                  {project.summary && (
                    <p className="mt-2 text-base text-slate-600">{project.summary}</p>
                  )}
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/portfolio/${project.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:border-blue-700 text-xs font-semibold text-slate-800"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-xs font-semibold"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 hover:border-blue-700 text-slate-900 text-xs font-semibold"
                  >
                    <span>Open Live Project</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h2 className="font-display text-base font-semibold text-slate-950">
                  Architecture & Implementation Notes
                </h2>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {project.description}
                </p>
              </div>
            </div>
          </article>

          <section className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                name={project.owner_name || 'Member'}
                src={project.owner_avatar}
                size="md"
              />
              <div>
                <p className="text-xs text-slate-500">
                  Project Owner · {project.owner_category}
                  {project.owner_is_demo ? ' · Demo' : ''}
                </p>
                <Link
                  to={`/profile/${project.user_id}`}
                  className="font-display text-base font-semibold text-slate-950 hover:text-blue-700"
                >
                  {project.owner_name}
                </Link>
                {project.owner_headline && (
                  <p className="text-xs text-slate-600 mt-0.5">{project.owner_headline}</p>
                )}
              </div>
            </div>
            <Link
              to={`/profile/${project.user_id}`}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
            >
              View Profile
            </Link>
          </section>
        </div>
      )}
    </AppShell>
  );
}
