import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { ImageWithFallback } from '../components/ImageWithFallback';

export function AboutPage() {
  return (
    <PublicLayout>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-medium text-blue-700">About SkillSphere</p>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-slate-950 tracking-tight [text-wrap:balance]">
              Connecting learning pathways with practical execution.
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Most learning platforms stop at passive video completion, while professional
              networks focus solely on polished resumes. SkillSphere bridges that divide by
              uniting structured skill roadmaps, hands-on project portfolios, peer discussion,
              and collaborative team building in one ecosystem.
            </p>
            <div className="mt-7 flex items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors"
              >
                <span>Join SkillSphere</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/learning"
                className="text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                Explore Roadmaps
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-200">
              <ImageWithFallback
                src="/src/assets/images/about_global_network_1794909896787.jpg"
                alt="Global university research and innovation commons"
                className="w-full h-full object-cover"
                fallbackTitle="Global Collaboration Commons"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <h2 className="font-display text-2xl font-bold text-slate-950">
          How the ecosystem works
        </h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="font-mono text-xs text-blue-700">01.</p>
            <h3 className="mt-2 font-display text-lg font-semibold text-slate-950">
              Guided Skill Mastery
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Members select core competencies, follow step-by-step roadmaps with curated
              reading and engineering milestones, and track completion transparently.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="font-mono text-xs text-blue-700">02.</p>
            <h3 className="mt-2 font-display text-lg font-semibold text-slate-950">
              Verifiable Portfolio Proof
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Every project includes architecture notes, technology stacks, source links, and
              live deployments tied directly to the member’s profile.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="font-mono text-xs text-blue-700">03.</p>
            <h3 className="mt-2 font-display text-lg font-semibold text-slate-950">
              Structured Team Formation
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Founders and project leads list required skills and team capacity; applicants send
              focused contribution pitches that convert directly into team memberships.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
