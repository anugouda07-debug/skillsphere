import React, { useEffect, useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { apiRequest, ApiError } from '../lib/api';
import type { Skill, UserSkill } from '../types';

const SKILL_CATEGORIES = [
  'All',
  'Programming',
  'Web Development',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Design',
  'Communication',
  'Business',
  'Entrepreneurship',
];

export function SkillsPage() {
  const [catalog, setCatalog] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [proficiency, setProficiency] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    'Intermediate'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Custom skill form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Programming');
  const [customDesc, setCustomDesc] = useState('');

  const loadSkills = async (qStr = query, catStr = category) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (qStr) params.set('q', qStr);
      if (catStr !== 'All') params.set('category', catStr);
      const [catRes, mineRes] = await Promise.all([
        apiRequest<{ skills: Skill[] }>(`/api/skills?${params.toString()}`),
        apiRequest<{ user_skills: UserSkill[] }>('/api/user-skills'),
      ]);
      setCatalog(catRes.skills);
      setMySkills(mineRes.user_skills);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load skills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSkills(query, category);
  }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadSkills(query, category);
  };

  const handleAddSkill = async (skillId: number) => {
    setError('');
    try {
      await apiRequest('/api/user-skills', {
        method: 'POST',
        body: JSON.stringify({ skill_id: skillId, proficiency_level: proficiency }),
      });
      const mineRes = await apiRequest<{ user_skills: UserSkill[] }>('/api/user-skills');
      setMySkills(mineRes.user_skills);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add skill.');
    }
  };

  const handleRemoveSkill = async (userSkillId: number) => {
    setError('');
    try {
      await apiRequest(`/api/user-skills/${userSkillId}`, { method: 'DELETE' });
      setMySkills((prev) => prev.filter((s) => s.id !== userSkillId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove skill.');
    }
  };

  const handleCreateCustomSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const created = await apiRequest<{ skill: Skill }>('/api/skills', {
        method: 'POST',
        body: JSON.stringify({
          name: customName,
          category: customCategory,
          description: customDesc,
        }),
      });
      await handleAddSkill(created.skill.id);
      setCustomName('');
      setCustomDesc('');
      setShowCustomForm(false);
      await loadSkills(query, category);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create skill.');
    }
  };

  const mySkillIds = new Set(mySkills.map((s) => s.skill_id));

  return (
    <AppShell
      breadcrumb="Skills"
      action={
        <button
          type="button"
          onClick={() => setShowCustomForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Skill</span>
        </button>
      }
    >
      <div className="space-y-8">
        {error && (
          <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
            {error}
          </div>
        )}

        {showCustomForm && (
          <form
            onSubmit={handleCreateCustomSkill}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="font-display text-base font-semibold text-slate-950">
              Add New Skill to Catalog & Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Skill name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Docker & Containers"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  {SKILL_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Short description
              </label>
              <input
                type="text"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Brief summary of this capability"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
              >
                Save & Add to My Skills
              </button>
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* My Current Skills */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h1 className="font-display text-xl font-bold text-slate-950">My Skills</h1>
              <p className="text-sm text-slate-600">
                Skills saved to your profile power collaboration recommendations.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {mySkills.length} active skills
            </span>
          </div>

          {mySkills.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              You have not added any skills yet. Select skills from the catalog below.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
              {mySkills.map((sk) => (
                <div
                  key={sk.id}
                  className="px-4 py-3 flex items-center justify-between gap-4 bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{sk.name}</p>
                    <p className="text-xs text-slate-500">
                      {sk.category} · {sk.proficiency_level}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(sk.id)}
                    aria-label={`Remove ${sk.name}`}
                    className="p-2 text-slate-400 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Browse Skill Catalog */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-950">
                Browse Skill Catalog
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Search by keyword or filter by discipline, then select your proficiency level to add
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-2">
                <span>Add level:</span>
                <select
                  value={proficiency}
                  onChange={(e) =>
                    setProficiency(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>

              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search skills..."
                    className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SKILL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  category === cat
                    ? 'bg-slate-950 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="h-48 bg-slate-50 rounded-lg animate-pulse" />
          ) : catalog.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No skills matched your current filter.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catalog.map((skill) => {
                const added = mySkillIds.has(skill.id);
                return (
                  <div
                    key={skill.id}
                    className="p-4 rounded-lg border border-slate-200 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs text-slate-500">{skill.category}</p>
                      <h3 className="mt-0.5 text-sm font-semibold text-slate-950">{skill.name}</h3>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {skill.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSkill(skill.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        added
                          ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                          : 'bg-slate-950 text-white hover:bg-blue-800'
                      }`}
                    >
                      {added ? 'Update Level' : 'Add Skill'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
