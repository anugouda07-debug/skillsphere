import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Briefcase, MessageSquare, Users } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface OverviewData {
  counts: {
    members: number;
    skills: number;
    roadmaps: number;
    projects: number;
    collaborations: number;
  };
  featured_roadmaps: Array<{
    id: number;
    title: string;
    category: string;
    difficulty: string;
    estimated_hours: number;
  }>;
}

const PERSONAS = [
  {
    index: '01',
    role: 'Students',
    summary: 'Follow structured skill roadmaps, discover study partners, and ship your first real projects before graduation.',
  },
  {
    index: '02',
    role: 'Graduates',
    summary: 'Turn coursework into verifiable portfolio case studies and join applied product teams to bridge the experience gap.',
  },
  {
    index: '03',
    role: 'Working Professionals',
    summary: 'Advance into adjacent technical domains, publish architectural insights, and mentor emerging builders.',
  },
  {
    index: '04',
    role: 'Entrepreneurs',
    summary: 'Publish product briefs, recruit skilled collaborators by stack, and build early prototypes with global talent.',
  },
];

export function LandingPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    apiRequest<OverviewData>('/api/overview')
      .then(setOverview)
      .catch(() => {
        // fallback handled cleanly in render
      });
  }, []);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-[#0B162C] text-white border-b border-slate-800">
        <div className="max-w-[1200px] mx-auto px-6 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-medium text-blue-300 tracking-wide">
              Learn. Connect. Create. Grow.
            </p>
            <h1
              className="mt-4 font-display font-bold tracking-tight text-white leading-[1.1] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)' }}
            >
              One connected workspace for skills, portfolios, and real collaboration.
            </h1>
            <p className="mt-5 text-base text-slate-300 leading-relaxed max-w-xl">
              SkillSphere brings together students, graduates, working professionals, and
              entrepreneurs to follow structured learning pathways, showcase project proof,
              exchange practical knowledge, and form working project teams.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>{user ? 'Go to Dashboard' : 'Create Free Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={user ? '/learning' : '/login'}
                className="inline-flex items-center px-5 py-3 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800/80 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                {user ? 'Browse Roadmaps' : 'Sign In / Demo Accounts'}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <ImageWithFallback
                src="/src/assets/images/hero_skillsphere_collab_1794909896758.jpg"
                alt="Students, engineers, and founders collaborating at SkillSphere innovation table"
                className="w-full h-full object-cover"
                fallbackTitle="SkillSphere Collaboration Studio"
              />
            </div>
          </div>
        </div>

        {/* Full-width live platform metric strip below hero */}
        <div className="border-t border-slate-800/80 bg-slate-950/50">
          <div className="max-w-[1200px] mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl font-display font-bold text-white tabular-nums">
                {overview ? overview.counts.roadmaps : 5}
              </p>
              <p className="text-xs text-slate-400 mt-1">Structured Learning Roadmaps</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-white tabular-nums">
                {overview ? overview.counts.skills : 14}
              </p>
              <p className="text-xs text-slate-400 mt-1">Curated Domain Skills</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-white tabular-nums">
                {overview ? overview.counts.projects : 4}
              </p>
              <p className="text-xs text-slate-400 mt-1">Published Portfolio Builds</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-white tabular-nums">
                {overview ? overview.counts.collaborations : 3}
              </p>
              <p className="text-xs text-slate-400 mt-1">Active Collaboration Teams</p>
            </div>
          </div>
        </div>
      </section>

      {/* Four User Categories */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight [text-wrap:balance]">
            Built for four stages of growth
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Every profile on SkillSphere connects directly to roadmaps, portfolios, and
            cross-disciplinary project teams tailored to where you are right now.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PERSONAS.map((p) => (
            <div
              key={p.role}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <p className="font-mono text-xs font-medium text-blue-700 tabular-nums">
                  {p.index}.
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-950">
                  {p.role}
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{p.summary}</p>
              </div>
              <Link
                to="/register"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                <span>Join as {p.role.replace(/s$/, '')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Asymmetric Bento Capabilities */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                Core Platform Modules
              </h2>
              <p className="mt-2 text-base text-slate-600 max-w-xl">
                Every module persists your progress, builds your public proof of work, and
                connects you with active collaborators.
              </p>
            </div>
            <Link
              to="/about"
              className="text-sm font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap"
            >
              Read platform overview →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <BookOpen className="w-5 h-5 text-blue-700" />
                <h3 className="mt-4 font-display text-xl font-semibold text-slate-950">
                  01. Skill Development & Learning Roadmaps
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xl">
                  Explore curated pathways across Programming, Web Development, Artificial
                  Intelligence, Data Science, Design, and Entrepreneurship. Check off
                  milestones, track completion percentages, and contribute learning resources.
                </p>
              </div>
              {overview && overview.featured_roadmaps.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {overview.featured_roadmaps.slice(0, 2).map((rm) => (
                    <Link
                      key={rm.id}
                      to={`/learning/${rm.id}`}
                      className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                    >
                      <p className="text-xs text-slate-500">
                        {rm.category} · {rm.difficulty} · {rm.estimated_hours} hrs
                      </p>
                      <p className="mt-1 font-display text-sm font-semibold text-slate-900">
                        {rm.title}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <Briefcase className="w-5 h-5 text-violet-700" />
                <h3 className="mt-4 font-display text-xl font-semibold text-slate-950">
                  02. Project Portfolio
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Publish working software, research notebooks, and venture prototypes with
                  architecture writeups, technology stacks, GitHub links, and live demos.
                </p>
              </div>
              <Link
                to="/portfolio"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                <span>Open Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <MessageSquare className="w-5 h-5 text-blue-700" />
                <h3 className="mt-4 font-display text-xl font-semibold text-slate-950">
                  03. Knowledge Community
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Ask focused technical questions, document engineering tradeoffs, and discuss
                  learning lessons sorted by live community activity.
                </p>
              </div>
              <Link
                to="/community"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                <span>Browse Discussions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="lg:col-span-2 bg-[#0B162C] text-white border border-slate-800 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <Users className="w-5 h-5 text-blue-300" />
                <h3 className="mt-4 font-display text-xl font-semibold text-white">
                  04. Project Collaboration Hub
                </h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-xl">
                  Launch cross-functional project briefs, specify required skills, review
                  incoming join requests from motivated learners and professionals, and assemble
                  an approved team roster.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  to="/collaborations"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                >
                  <span>Explore Open Projects</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Conversion Band */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950">
              Start building your SkillSphere profile today
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Register a new member account in seconds or sign in with one of our four seeded
              demonstration accounts to test every workflow immediately.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Try Demo Accounts
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
