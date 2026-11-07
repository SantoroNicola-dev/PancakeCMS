"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Flag,
  Pin,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import { formatDateIt } from "@/lib/utils";

interface AdminCommentRow {
  id: string;
  content: string;
  status: "APPROVED" | "PENDING" | "SPAM" | "REJECTED";
  likesCount: number;
  flaggedCount: number;
  isPinned: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
  post: { id: string; title: string; slug: string };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminCommentRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadComments = async () => {
    const res = await fetch("/api/comments?admin=1");
    const data = await res.json();
    setComments(data.comments || []);
  };

  useEffect(() => {
    loadComments();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadComments();
  };

  const togglePin = async (id: string) => {
    await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "pin" }),
    });
    loadComments();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Vuoi eliminare definitivamente questo commento?"))
      return;
    await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    loadComments();
  };

  const filtered = comments.filter((c) => {
    if (statusFilter === "FLAGGED") return c.flaggedCount > 0;
    if (statusFilter !== "ALL") return c.status === statusFilter;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Moderazione Commenti Lettori
          </h1>
          <p className="text-xs text-slate-500">
            Approva, metti in evidenza (Pin), contrassegna come Spam o rimuovi i commenti della community.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900">
          {[
            { id: "ALL", label: `Tutti (${comments.length})` },
            {
              id: "APPROVED",
              label: `Approvati (${
                comments.filter((c) => c.status === "APPROVED").length
              })`,
            },
            {
              id: "PENDING",
              label: `In Attesa (${
                comments.filter((c) => c.status === "PENDING").length
              })`,
            },
            {
              id: "SPAM",
              label: `Spam (${
                comments.filter((c) => c.status === "SPAM").length
              })`,
            },
            {
              id: "FLAGGED",
              label: `Segnalati (${
                comments.filter((c) => c.flaggedCount > 0).length
              })`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                statusFilter === tab.id
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            Nessun commento in questa coda.
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {c.user.name}
                  </span>
                  <span className="text-slate-400">({c.user.email})</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700"
                        : c.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {c.status}
                  </span>
                  {c.isPinned && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      📌 Fissato in alto
                    </span>
                  )}
                  {c.flaggedCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      <Flag className="h-3 w-3" /> {c.flaggedCount} segnalazioni
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {c.content}
                </p>

                <p className="text-[11px] text-slate-400">
                  Articolo:{" "}
                  <Link
                    href={`/articolo/${c.post.slug}`}
                    target="_blank"
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {c.post.title}
                  </Link>{" "}
                  • {formatDateIt(c.createdAt, true)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {c.status !== "APPROVED" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(c.id, "APPROVED")}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approva
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => togglePin(c.id)}
                  className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium ${
                    c.isPinned
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Pin className="h-3.5 w-3.5" /> {c.isPinned ? "Sblocca" : "Pin"}
                </button>
                {c.status !== "SPAM" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(c.id, "SPAM")}
                    className="inline-flex items-center gap-1 rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" /> Spam
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="rounded-xl border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                  title="Elimina"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

