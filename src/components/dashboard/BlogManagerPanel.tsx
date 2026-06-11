"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/notifications/ToastProvider";
import { Panel } from "@/components/dashboard/DashboardUI";
import { effectInit } from "@/lib/react/effect-init";

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  seoTitle?: string;
  publishedAt: string;
  url: string;
  readingMinutes: number;
  webflow: { publishedAt: string; liveUrl: string | null } | null;
};

type EditState = {
  title: string;
  description: string;
  seoTitle: string;
};

function EditModal({
  post,
  onClose,
  onSaved,
}: {
  post: BlogPost;
  onClose: () => void;
  onSaved: (slug: string, fields: Partial<EditState>) => void;
}) {
  const toast = useToast();
  const [fields, setFields] = useState<EditState>({
    title: post.title,
    description: post.description,
    seoTitle: post.seoTitle ?? post.title,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/blog/posts/${encodeURIComponent(post.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(fields),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      toast.success("Post updated");
      onSaved(post.slug, fields);
      onClose();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Edit post</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink transition text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="edit-title">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={fields.title}
              onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="edit-seo-title">
              SEO title{" "}
              <span className="font-normal text-muted">(≤ 60 chars shown in Google)</span>
            </label>
            <input
              id="edit-seo-title"
              type="text"
              value={fields.seoTitle}
              onChange={(e) => setFields((f) => ({ ...f, seoTitle: e.target.value }))}
              maxLength={70}
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
            <p className="mt-1 text-xs text-muted">{fields.seoTitle.length}/70 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="edit-desc">
              Meta description{" "}
              <span className="font-normal text-muted">(≤ 160 chars)</span>
            </label>
            <textarea
              id="edit-desc"
              rows={3}
              value={fields.description}
              onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
              maxLength={200}
              className="mt-1 w-full resize-none rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
            <p className="mt-1 text-xs text-muted">{fields.description.length}/160 characters</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !fields.title.trim()}
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BlogManagerPanel({ workspaceId }: { workspaceId: string }) {
  const toast = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/blog/posts?workspaceId=${encodeURIComponent(workspaceId)}&scope=workspace`,
        { credentials: "include" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as { posts: BlogPost[] };
      setPosts(data.posts);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    effectInit(() => {
      void load();
    });
  }, [load]);

  async function handleDelete(slug: string) {
    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Delete failed");
        return;
      }
      toast.success("Post deleted");
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingSlug(null);
      setConfirmDeleteSlug(null);
    }
  }

  function handleSaved(slug: string, fields: Partial<EditState>) {
    setPosts((prev) =>
      prev.map((p) =>
        p.slug === slug
          ? {
              ...p,
              title: fields.title ?? p.title,
              description: fields.description ?? p.description,
              seoTitle: fields.seoTitle ?? p.seoTitle,
            }
          : p,
      ),
    );
  }

  return (
    <>
      {editingPost && (
        <EditModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSaved={handleSaved}
        />
      )}

      <Panel title="Manage blog posts">
        <p className="mb-4 text-sm text-muted">
          Edit metadata or delete posts from your blog. Changes to the title and
          description take effect immediately on the public blog page.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-surface" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted">No posts yet — generate your first article above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {posts.map((post) => {
              const isDeleting = deletingSlug === post.slug;
              const isConfirming = confirmDeleteSlug === post.slug;

              return (
                <li
                  key={post.slug}
                  className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={post.url}
                        target="_blank"
                        className="font-medium text-accent hover:underline line-clamp-1"
                      >
                        {post.title}
                      </Link>
                      {post.webflow && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                          Live on Webflow
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted line-clamp-1">{post.description}</p>
                    <p className="mt-0.5 text-xs text-muted/70">
                      {new Date(post.publishedAt).toLocaleDateString()} ·{" "}
                      {post.readingMinutes} min read · /blog/{post.slug}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPost(post)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition"
                    >
                      Edit
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-600 font-medium">Delete?</span>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => void handleDelete(post.slug)}
                          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
                        >
                          {isDeleting ? "Deleting…" : "Yes, delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSlug(null)}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSlug(post.slug)}
                        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
