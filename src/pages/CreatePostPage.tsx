import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { apiRequest, ApiError } from '../lib/api';
import type { CommunityPost } from '../types';

export function CreatePostPage() {
  const navigate = useNavigate();
  const [postType, setPostType] = useState<'Question' | 'Knowledge Share' | 'Learning Experience'>(
    'Knowledge Share'
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ post: CommunityPost }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          post_type: postType,
          title,
          content,
          tags,
        }),
      });
      navigate(`/community/${res.post.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to publish post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      breadcrumb="Community / Create Post"
      action={
        <Link
          to="/community"
          className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
        >
          Back to Feed
        </Link>
      }
    >
      <div className="max-w-[740px] bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <h1 className="font-display text-xl font-bold text-slate-950">
          Publish to Knowledge Community
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Ask a technical question, share engineering lessons, or document your learning journey.
        </p>

        {error && (
          <div className="mt-4 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <span className="block text-sm font-medium text-slate-800 mb-2">Post category</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['Knowledge Share', 'Question', 'Learning Experience'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPostType(t)}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    postType === t
                      ? 'border-blue-700 bg-blue-50 text-blue-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">Title</label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Write a clear, specific discussion title"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Content (minimum 20 characters)
            </label>
            <textarea
              rows={6}
              required
              minLength={20}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share context, code patterns, or specific questions so peers can give helpful responses."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Topics / Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Python, React, System Design, Career"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-slate-950 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Publish Post'}
            </button>
            <Link
              to="/community"
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
