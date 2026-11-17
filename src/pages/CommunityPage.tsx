import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { PublicLayout } from '../components/PublicLayout';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import type { CommunityPost } from '../types';

const POST_TYPES = ['All', 'Question', 'Knowledge Share', 'Learning Experience'];

export function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postType, setPostType] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPosts = async (typeVal = postType, qStr = query) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeVal !== 'All') params.set('type', typeVal);
      if (qStr) params.set('q', qStr);
      const res = await apiRequest<{ posts: CommunityPost[] }>(
        `/api/posts?${params.toString()}`
      );
      setPosts(res.posts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts(postType, query);
  }, [postType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadPosts(postType, query);
  };

  const inner = (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-950">Knowledge Community</h1>
          <p className="mt-1 text-sm text-slate-600">
            Discussions sorted by latest activity — ask questions, share lessons, and exchange architecture insights.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search discussions..."
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-950 text-white text-xs font-semibold cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {POST_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPostType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                postType === t
                  ? 'bg-slate-950 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {!user && (
          <Link
            to="/login"
            className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
          >
            Sign in to publish or comment →
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse" />
          <div className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-600">No community discussions matched your filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <Avatar name={post.author_name} src={post.author_avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-blue-700">{post.post_type}</span> ·{' '}
                    <span className="font-medium text-slate-800">{post.author_name}</span> (
                    {post.author_category}
                    {post.author_is_demo ? ' · Demo' : ''}) ·{' '}
                    <span>{new Date(post.last_activity_at + 'Z').toLocaleDateString()}</span>
                  </p>

                  <Link
                    to={user ? `/community/${post.id}` : '/login'}
                    className="mt-1.5 block font-display text-lg font-semibold text-slate-950 hover:text-blue-700"
                  >
                    {post.title}
                  </Link>

                  <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="truncate">{post.tags || 'General Discussion'}</span>
                    <Link
                      to={user ? `/community/${post.id}` : '/login'}
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-800 hover:text-blue-700 tabular-nums whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.comment_count ?? 0} comments</span>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  if (user) {
    return (
      <AppShell
        breadcrumb="Knowledge Community"
        action={
          <Link
            to="/community/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-blue-800 text-white text-xs font-semibold whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Post</span>
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
