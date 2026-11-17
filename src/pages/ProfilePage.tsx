import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, MapPin, Building2, Edit3 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import type { PortfolioProject, Profile, User, UserSkill } from '../types';

interface ProfileResponse {
  user: User;
  profile: Profile;
  skills: UserSkill[];
  projects: PortfolioProject[];
}

export function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwn = !id || Number(id) === currentUser?.id;

  useEffect(() => {
    setLoading(true);
    const endpoint = id ? `/api/profiles/${id}` : '/api/profile/me';
    apiRequest<ProfileResponse>(endpoint)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AppShell
      breadcrumb={isOwn ? 'My Profile' : data?.user.full_name || 'Member Profile'}
      action={
        isOwn ? (
          <Link
            to="/profile/edit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </Link>
        ) : undefined
      }
    >
      {loading && (
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
      )}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* Header Card */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-[#0B162C] via-slate-900 to-blue-950" />
            <div className="px-6 sm:px-8 pb-8 -mt-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="ring-4 ring-white rounded-full inline-block w-fit bg-white">
                  <Avatar name={data.user.full_name} src={data.profile?.avatar_url} size="lg" />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-blue-700">
                  {data.profile?.github_url && (
                    <a
                      href={data.profile.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <span>GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {data.profile?.linkedin_url && (
                    <a
                      href={data.profile.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <span>LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {data.profile?.website_url && (
                    <a
                      href={data.profile.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-blue-700">
                  {data.user.category}
                  {data.user.is_demo ? ' · Demonstration Account' : ''}
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">
                  {data.user.full_name}
                </h1>
                <p className="mt-1 text-base text-slate-700">
                  {data.profile?.headline || 'Member of SkillSphere'}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                  {data.profile?.education_or_role && (
                    <span>{data.profile.education_or_role}</span>
                  )}
                  {data.profile?.organization && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{data.profile.organization}</span>
                    </span>
                  )}
                  {data.profile?.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{data.profile.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bio & Achievements */}
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-display text-base font-semibold text-slate-950">About</h2>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {data.profile?.bio || 'No biography added yet.'}
                </p>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-display text-base font-semibold text-slate-950">
                  Interests & Achievements
                </h2>
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Focus Areas</p>
                    <p className="mt-1 text-slate-800">
                      {data.profile?.interests || 'Not specified yet.'}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500">Notable Achievements</p>
                    <p className="mt-1 text-slate-800">
                      {data.profile?.achievements || 'No achievements recorded yet.'}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Skills List */}
            <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-semibold text-slate-950">
                  Verified Profile Skills
                </h2>
                {isOwn && (
                  <Link to="/skills" className="text-xs font-semibold text-blue-700 hover:underline">
                    Edit skills
                  </Link>
                )}
              </div>

              {data.skills.length === 0 ? (
                <p className="text-sm text-slate-500">No skills added to this profile yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.skills.map((sk) => (
                    <li key={sk.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{sk.name}</p>
                        <p className="text-xs text-slate-500">{sk.category}</p>
                      </div>
                      <span className="text-xs font-medium text-slate-700">
                        {sk.proficiency_level}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Portfolio Grid */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-base font-semibold text-slate-950">
                Portfolio Projects ({data.projects.length})
              </h2>
              {isOwn && (
                <Link
                  to="/portfolio/new"
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  + Add Project
                </Link>
              )}
            </div>

            {data.projects.length === 0 ? (
              <p className="text-sm text-slate-500">No portfolio projects published yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.projects.map((proj) => (
                  <Link
                    key={proj.id}
                    to={`/portfolio/${proj.id}`}
                    className="border border-slate-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors flex flex-col"
                  >
                    <div className="h-40 bg-slate-100 border-b border-slate-200">
                      <ImageWithFallback
                        src={proj.thumbnail_url}
                        alt={proj.title}
                        className="w-full h-full object-cover"
                        fallbackTitle={proj.title}
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-500 truncate">{proj.technologies}</p>
                        <h3 className="mt-1 font-display text-base font-semibold text-slate-950">
                          {proj.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                          {proj.summary || proj.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
