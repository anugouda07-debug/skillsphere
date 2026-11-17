import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Inbox } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { apiRequest } from '../lib/api';
import type {
  CollaborationProject,
  CommunityPost,
  PortfolioProject,
  Profile,
  RoadmapSummary,
  User,
  UserSkill,
} from '../types';

interface DashboardPayload {
  user: User;
  profile: Profile;
  skills: UserSkill[];
  learning: {
    total_completed_steps: number;
    total_steps: number;
    overall_percent: number;
    recent_roadmaps: RoadmapSummary[];
  };
  projects: PortfolioProject[];
  recent_posts: CommunityPost[];
  recommended_collaborations: CollaborationProject[];
  pending_incoming_requests: number;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<DashboardPayload>('/api/dashboard')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell
      breadcrumb="Dashboard"
      action={
        <div className="flex items-center gap-2">
          <Link
            to="/portfolio/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </Link>
        </div>
      }
    >
      {loading && (
        <div className="space-y-6">
          <div className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
            <div className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
            <div className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* Welcome & Profile Summary */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <Avatar name={data.user.full_name} src={data.profile?.avatar_url} size="lg" />
              <div>
                <p className="text-xs font-medium text-blue-700">
                  {data.user.category}
                  {data.user.is_demo ? ' · Demonstration Account' : ''}
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">
                  Welcome back, {data.user.full_name}
                </h1>
                <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                  {data.profile?.headline || 'Complete your headline and interests in Profile Settings.'}
                </p>
                {data.profile?.interests && (
                  <p className="mt-2 text-xs text-slate-500">
                    Interests: {data.profile.interests}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/profile/edit"
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-800 transition-colors whitespace-nowrap"
              >
                Edit Profile
              </Link>
              <Link
                to="/community/new"
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-800 transition-colors whitespace-nowrap"
              >
                Share Post
              </Link>
              <Link
                to="/collaborations/new"
                className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Start Collaboration
              </Link>
            </div>
          </section>

          {/* Key Numeric Overview Row */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500 font-medium">Learning Completion</p>
              <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
                {data.learning.overall_percent}%
              </p>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                {data.learning.total_completed_steps} of {data.learning.total_steps} roadmap steps
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500 font-medium">Profile Skills</p>
              <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
                {data.skills.length}
              </p>
              <Link to="/skills" className="mt-1 inline-block text-xs text-blue-700 hover:underline">
                Manage skills →
              </Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500 font-medium">Portfolio Projects</p>
              <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
                {data.projects.length}
              </p>
              <Link to="/portfolio" className="mt-1 inline-block text-xs text-blue-700 hover:underline">
                Open portfolio →
              </Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500 font-medium">Incoming Requests</p>
              <p className="mt-2 font-display text-2xl font-bold text-slate-950 tabular-nums">
                {data.pending_incoming_requests}
              </p>
              <Link
                to="/collaboration-requests"
                className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
              >
                <Inbox className="w-3 h-3" />
                <span>Review requests</span>
              </Link>
            </div>
          </section>

          {/* Recently Viewed Roadmaps & Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-lg font-semibold text-slate-950">
                    Recently Viewed Roadmaps
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pick up where you left off across guided skill pathways
                  </p>
                </div>
                <Link
                  to="/my-learning"
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap"
                >
                  All progress →
                </Link>
              </div>

              <div className="divide-y divide-slate-200">
                {data.learning.recent_roadmaps.map((rm) => (
                  <div
                    key={rm.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">
                        {rm.category} · {rm.difficulty} · {rm.estimated_hours} hrs
                      </p>
                      <Link
                        to={`/learning/${rm.id}`}
                        className="mt-0.5 block font-display text-sm font-semibold text-slate-950 hover:text-blue-700"
                      >
                        {rm.title}
                      </Link>
                      <div className="mt-2 w-full max-w-sm h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-700 transition-all"
                          style={{ width: `${rm.progress_percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-xs text-slate-700 tabular-nums">
                        {rm.completed_steps}/{rm.total_steps} ({rm.progress_percent}%)
                      </span>
                      <Link
                        to={`/learning/${rm.id}`}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-blue-700 text-xs font-medium text-slate-800 whitespace-nowrap"
                      >
                        Continue
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold text-slate-950">
                    Your Skills
                  </h2>
                  <Link to="/skills" className="text-xs font-semibold text-blue-700 hover:underline">
                    Add skill
                  </Link>
                </div>

                {data.skills.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No skills added yet. Add skills to receive matched collaboration recommendations.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.skills.map((sk) => (
                      <li key={sk.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{sk.name}</p>
                          <p className="text-xs text-slate-500">{sk.category}</p>
                        </div>
                        <span className="text-xs font-medium text-slate-600 shrink-0">
                          {sk.proficiency_level}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link
                to="/skills"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                <span>Browse full skill catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </section>
          </div>

          {/* Portfolio Projects */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-950">
                  Portfolio Projects
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Published engineering builds and case studies on your profile
                </p>
              </div>
              <Link
                to="/portfolio"
                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Manage portfolio →
              </Link>
            </div>

            {data.projects.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
                <p className="text-sm text-slate-600">You have not added a portfolio project yet.</p>
                <Link
                  to="/portfolio/new"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-950 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish First Project</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.projects.map((proj) => (
                  <Link
                    key={proj.id}
                    to={`/portfolio/${proj.id}`}
                    className="p-4 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-xs text-slate-500 truncate">{proj.technologies}</p>
                      <h3 className="mt-1 font-display text-base font-semibold text-slate-950">
                        {proj.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                        {proj.summary || proj.description}
                      </p>
                    </div>
                    <span className="mt-3 text-xs font-medium text-blue-700">View project →</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Community & Collaboration Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-slate-950">
                  Recent Community Discussions
                </h2>
                <Link
                  to="/community"
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Open community →
                </Link>
              </div>
              <div className="divide-y divide-slate-200">
                {data.recent_posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/community/${post.id}`}
                    className="block py-3.5 first:pt-0 last:pb-0 group"
                  >
                    <p className="text-xs text-slate-500">
                      {post.post_type} · {post.author_name} ({post.author_category}) ·{' '}
                      <span className="tabular-nums">{post.comment_count ?? 0} comments</span>
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                      {post.title}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-slate-950">
                  Recommended Collaboration Projects
                </h2>
                <Link
                  to="/collaborations"
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Browse hub →
                </Link>
              </div>
              {data.recommended_collaborations.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No open external collaboration projects at the moment. Create one to invite peers.
                </p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {data.recommended_collaborations.map((col) => (
                    <Link
                      key={col.id}
                      to={`/collaborations/${col.id}`}
                      className="block py-3.5 first:pt-0 last:pb-0 group"
                    >
                      <p className="text-xs text-slate-500">
                        {col.category} · Led by {col.owner_name} ·{' '}
                        <span className="tabular-nums">
                          {col.member_count ?? 1}/{col.team_size} members
                        </span>
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                        {col.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 truncate">
                        Needs: {col.required_skills}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
