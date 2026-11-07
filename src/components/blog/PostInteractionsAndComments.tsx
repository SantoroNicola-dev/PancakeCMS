"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  CornerDownRight,
  Eye,
  Flag,
  Heart,
  MessageSquare,
  Pin,
  Send,
  Share2,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";
import { formatDateIt } from "@/lib/utils";
import { trackCmsEvent } from "@/components/analytics/GoogleAnalyticsAndConsent";

interface CommentAuthor {
  id: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "AUTHOR" | "READER";
  avatarUrl?: string | null;
  jobTitle?: string | null;
}

interface CommentItem {
  id: string;
  content: string;
  likesCount: number;
  isPinned?: boolean;
  createdAt: string;
  user: CommentAuthor;
  replies?: CommentItem[];
}

interface Props {
  postId: string;
  postTitle: string;
  initialViews: number;
  initialLikesCount: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
  allowComments: boolean;
  currentUser: {
    id: string;
    name: string;
    role: "ADMIN" | "EDITOR" | "AUTHOR" | "READER";
  } | null;
}

export function PostInteractionsAndComments({
  postId,
  postTitle,
  initialViews,
  initialLikesCount,
  initialLiked,
  initialBookmarked,
  allowComments,
  currentUser,
}: Props) {
  const [views, setViews] = useState(initialViews);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [sharedCopied, setSharedCopied] = useState(false);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [moderationNotice, setModerationNotice] = useState("");

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?postId=${postId}`);
    const data = await res.json();
    setComments(data.comments || []);
  };

  useEffect(() => {
    fetch(`/api/posts/${postId}/interact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.viewsCount === "number") setViews(d.viewsCount);
      })
      .catch(() => {});

    if (allowComments) {
      fetchComments();
    }
  }, [postId, allowComments]);

  const handleToggleLike = async () => {
    if (!currentUser) {
      alert("Accedi o registrati gratuitamente come lettore per mettere Mi Piace.");
      return;
    }
    const res = await fetch(`/api/posts/${postId}/interact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });
    const data = await res.json();
    if (res.ok) {
      setLiked(data.liked);
      setLikesCount(data.likesCount);
      trackCmsEvent("post_like", { post_id: postId });
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentUser) {
      alert(
        "Accedi o registrati come lettore per salvare gli articoli nella tua lista di lettura."
      );
      return;
    }
    const res = await fetch(`/api/posts/${postId}/interact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bookmark" }),
    });
    const data = await res.json();
    if (res.ok) {
      setBookmarked(data.bookmarked);
      trackCmsEvent("post_bookmark", { post_id: postId });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setSharedCopied(true);
    trackCmsEvent("post_share", { post_title: postTitle });
    setTimeout(() => setSharedCopied(false), 2500);
  };

  const handlePostComment = async (parentId?: string) => {
    const content = parentId ? replyText : newComment;
    if (!content.trim()) return;
    setSubmitting(true);
    setModerationNotice("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, parentId, content }),
      });
      const data = await res.json();
      if (res.ok) {
        if (parentId) {
          setReplyText("");
          setReplyingTo(null);
        } else {
          setNewComment("");
        }
        if (data.pendingModeration) {
          setModerationNotice(
            "Grazie! Il tuo commento è stato inviato ed è in attesa di approvazione della redazione."
          );
        } else {
          fetchComments();
        }
        trackCmsEvent("comment_posted", { post_id: postId });
      } else {
        alert(data.error || "Errore durante l'invio del commento.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) return;
    await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: commentId, action: "like" }),
    });
    fetchComments();
  };

  const handleFlagComment = async (commentId: string) => {
    if (!currentUser) return;
    await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: commentId, action: "flag" }),
    });
    alert("Commento segnalato ai moderatori.");
  };

  const roleBadge = (role: CommentAuthor["role"]) => {
    if (role === "ADMIN") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          <ShieldCheck className="h-3 w-3" /> Direttrice / Admin
        </span>
      );
    }
    if (role === "EDITOR" || role === "AUTHOR") {
      return (
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Redazione
        </span>
      );
    }
    return null;
  };

  return (
    <div className="mt-12 space-y-10 border-t border-slate-200 pt-8 dark:border-slate-800">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              liked
                ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-400"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
            <span>{likesCount} Mi piace</span>
          </button>

          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              bookmarked
                ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            <Bookmark
              className={`h-4 w-4 ${bookmarked ? "fill-brand-600 text-brand-600" : ""}`}
            />
            <span>{bookmarked ? "Salvato nei preferiti" : "Salva articolo"}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> {views} letture
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            {sharedCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Link copiato!
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" /> Condividi
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {allowComments && (
        <section id="commenti" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-serif text-2xl font-bold text-slate-900 dark:text-white">
              <MessageSquare className="h-5 w-5 text-brand-600" />
              Conversazione tra i lettori ({comments.length})
            </h3>
          </div>

          {moderationNotice && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              {moderationNotice}
            </div>
          )}

          {/* Comment Box or Login Prompt */}
          {currentUser ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-2 text-xs text-slate-500">
                Stai commentando come{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {currentUser.name}
                </strong>
              </p>
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Condividi una riflessione costruttiva su questo articolo..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={submitting || !newComment.trim()}
                  onClick={() => handlePostComment()}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" /> Pubblica commento
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center sm:flex-row sm:text-left dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Partecipa alla discussione con gli altri lettori
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  Per mantenere la conversazione autentica e priva di spam, i commenti sono riservati ai lettori registrati.
                </p>
              </div>
              <Link
                href="/login"
                className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                Accedi o Registrati gratis
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {comment.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {comment.user.name}
                        </span>
                        {roleBadge(comment.user.role)}
                        {comment.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <Pin className="h-3 w-3" /> In evidenza
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {formatDateIt(comment.createdAt, true)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleLikeComment(comment.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> {comment.likesCount}
                    </button>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === comment.id ? null : comment.id
                          )
                        }
                        className="rounded-lg px-2 py-1 font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30"
                      >
                        Rispondi
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleFlagComment(comment.id)}
                      className="rounded-lg p-1 hover:text-rose-500"
                      title="Segnala commento"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {comment.content}
                </p>

                {/* Reply Box */}
                {replyingTo === comment.id && (
                  <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Rispondi a ${comment.user.name}...`}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                    />
                    <button
                      type="button"
                      onClick={() => handlePostComment(comment.id)}
                      className="rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white"
                    >
                      Invia risposta
                    </button>
                  </div>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 space-y-3 border-l-2 border-slate-200 pl-4 dark:border-slate-800">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-950"
                      >
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {reply.user.name}
                          </span>
                          {roleBadge(reply.user.role)}
                          <span className="text-[11px] text-slate-400">
                            • {formatDateIt(reply.createdAt, true)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

