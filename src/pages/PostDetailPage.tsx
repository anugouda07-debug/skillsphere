import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../lib/api';
import type { CommunityPost, PostComment } from '../types';

export function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ post: CommunityPost; comments: PostComment[] }>(`/api/posts/${id}`)
      .then((res) => {
        setPost(res.post);
        setComments(res.comments);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load post.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ comment: PostComment }>(`/api/posts/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText }),
      });
      setComments((prev) => [...prev, res.comment]);
      setCommentText('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      await apiRequest(`/api/posts/${id}`, { method: 'DELETE' });
      navigate('/community');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete post.');
    }
  };

  return (
    <AppShell
      breadcrumb={`Community / ${post?.title || 'Discussion'}`}
      action={
        <Link
          to="/community"
          className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          Back to Community
        </Link>
      }
    >
      {loading && <div className="h-56 bg-white border border-slate-200 rounded-xl animate-pulse" />}
      {error && (
        <div className="mb-4 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}

      {post && (
        <div className="max-w-[840px] space-y-6">
          <article className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar name={post.author_name} src={post.author_avatar} size="md" />
                <div>
                  <p className="text-xs font-medium text-blue-700">{post.post_type}</p>
                  <Link
                    to={`/profile/${post.user_id}`}
                    className="text-sm font-semibold text-slate-950 hover:text-blue-700"
                  >
                    {post.author_name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {post.author_category}
                    {post.author_organization ? ` · ${post.author_organization}` : ''}
                    {post.author_is_demo ? ' · Demo' : ''}
                  </p>
                </div>
              </div>

              {post.user_id === user?.id && (
                <button
                  type="button"
                  onClick={handleDeletePost}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <h1 className="mt-5 font-display text-2xl font-bold text-slate-950">{post.title}</h1>
            <p className="mt-4 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {post.content}
            </p>
            {post.tags && (
              <p className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
                Topics: {post.tags}
              </p>
            )}
          </article>

          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <h2 className="font-display text-lg font-semibold text-slate-950 tabular-nums">
              Discussion ({comments.length})
            </h2>

            {comments.length === 0 ? (
              <p className="text-sm text-slate-500">
                No comments yet. Share the first constructive reply below.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {comments.map((c) => (
                  <div key={c.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-3.5">
                    <Avatar name={c.author_name} src={c.author_avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">
                        <Link
                          to={`/profile/${c.user_id}`}
                          className="font-semibold text-slate-900 hover:text-blue-700"
                        >
                          {c.author_name}
                        </Link>{' '}
                        · {c.author_category} ·{' '}
                        <span>{new Date(c.created_at + 'Z').toLocaleDateString()}</span>
                      </p>
                      <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-200 space-y-3">
              <label htmlFor="comment-box" className="block text-sm font-medium text-slate-800">
                Add a comment
              </label>
              <textarea
                id="comment-box"
                rows={3}
                required
                minLength={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a thoughtful response or follow-up question..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}
