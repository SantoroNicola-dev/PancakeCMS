"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Check,
  KeyRound,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { formatDateIt } from "@/lib/utils";

interface BookmarkedPost {
  id: string;
  createdAt: string;
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    readingTimeMin: number;
    coverImage: string | null;
    category: { name: string; slug: string } | null;
  };
}

interface UserComment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  post: { title: string; slug: string };
}

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "EDITOR" | "AUTHOR" | "READER";
    bio: string | null;
    jobTitle: string | null;
    avatarUrl: string | null;
    twoFactorEnabled: boolean;
    forceTwoFactor: boolean;
  };
  bookmarks: BookmarkedPost[];
  comments: UserComment[];
}

export function AccountClient({ user, bookmarks, comments }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "bookmarks" | "comments" | "profile" | "security"
  >("bookmarks");

  // Profile state
  const [name, setName] = useState(user.name);
  const [jobTitle, setJobTitle] = useState(user.jobTitle || "");
  const [bio, setBio] = useState(user.bio || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    user.twoFactorEnabled
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [secretBase32, setSecretBase32] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorSuccess, setTwoFactorSuccess] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          jobTitle,
          bio,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileNotice("Profilo aggiornato con successo!");
        setCurrentPassword("");
        setNewPassword("");
        router.refresh();
      } else {
        alert(data.error || "Errore durante l'aggiornamento.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleStart2FASetup = async () => {
    setLoading2FA(true);
    setTwoFactorError("");
    setTwoFactorSuccess("");
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (res.ok) {
        setQrCodeDataUrl(data.qrCodeDataUrl);
        setSecretBase32(data.secretBase32);
        setBackupCodes(data.backupCodes || []);
      } else {
        setTwoFactorError(data.error || "Errore durante la generazione del QR.");
      }
    } finally {
      setLoading2FA(false);
    }
  };

  const handleConfirmEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading2FA(true);
    setTwoFactorError("");
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", code: verifyCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFactorEnabled(true);
        setQrCodeDataUrl("");
        setVerifyCode("");
        setTwoFactorSuccess(
          "Autenticazione a Due Fattori (2FA) attivata! Conserva i tuoi codici di recupero in un luogo sicuro."
        );
        router.refresh();
      } else {
        setTwoFactorError(data.error || "Codice non valido.");
      }
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (
      !window.confirm(
        "Sei sicuro di voler disattivare la verifica a due fattori (2FA) sul tuo account?"
      )
    ) {
      return;
    }
    setLoading2FA(true);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      if (res.ok) {
        setTwoFactorEnabled(false);
        setQrCodeDataUrl("");
        setBackupCodes([]);
        setTwoFactorSuccess("2FA disattivato.");
        router.refresh();
      }
    } finally {
      setLoading2FA(false);
    }
  };

  const isStaff =
    user.role === "ADMIN" || user.role === "EDITOR" || user.role === "AUTHOR";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 font-serif text-xl font-bold text-white shadow">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                {user.name}
              </h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Ruolo: {user.role}
              </span>
              {twoFactorEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" /> 2FA Attivo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <ShieldAlert className="h-3.5 w-3.5" /> 2FA Disattivato
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {user.email} • {user.jobTitle || "Membro della Community"}
            </p>
          </div>
        </div>

        {isStaff && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <LayoutDashboard className="h-4 w-4" /> Vai al Pannello CMS Admin
          </Link>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("bookmarks")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "bookmarks"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <Bookmark className="h-4 w-4" /> Articoli Salvati ({bookmarks.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("comments")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "comments"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <MessageSquare className="h-4 w-4" /> I Miei Commenti ({comments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "profile"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <UserIcon className="h-4 w-4" /> Profilo &amp; Password
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "security"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-300"
          }`}
        >
          <KeyRound className="h-4 w-4" /> Sicurezza &amp; 2FA Authenticator
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "bookmarks" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {bookmarks.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                Non hai ancora salvato nessun articolo nei segnalibri. Clicca su &ldquo;Salva articolo&rdquo; mentre leggi un post!
              </div>
            ) : (
              bookmarks.map((b) => (
                <Link
                  key={b.id}
                  href={`/articolo/${b.post.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-500 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <span className="text-xs font-semibold text-brand-600">
                      {b.post.category?.name || "Articolo"}
                    </span>
                    <h3 className="mt-1 font-serif text-lg font-bold text-slate-900 group-hover:text-brand-600 dark:text-white">
                      {b.post.title}
                    </h3>
                    {b.post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                        {b.post.excerpt}
                      </p>
                    )}
                  </div>
                  <p className="mt-4 text-[11px] text-slate-400">
                    Salvato il {formatDateIt(b.createdAt)} • {b.post.readingTimeMin} min di lettura
                  </p>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                Non hai ancora scritto commenti sugli articoli.
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      href={`/articolo/${c.post.slug}`}
                      className="font-bold text-brand-600 hover:underline"
                    >
                      Su: {c.post.title}
                    </Link>
                    <span className="text-slate-400">
                      {formatDateIt(c.createdAt, true)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    {c.content}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <form
            onSubmit={handleSaveProfile}
            className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
              Modifica Profilo &amp; Credenziali
            </h2>

            {profileNotice && (
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700">
                <Check className="h-4 w-4" /> {profileNotice}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nome Visualizzato
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Qualifica / Ruolo Pubblico
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="es. Lettore appassionato / Autrice..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Biografia Breve (Mostrata sotto i tuoi articoli o nel profilo)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password Attuale (Solo se vuoi cambiarla)
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nuova Password (min. 8 caratteri)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Salva Modifiche Profilo
            </button>
          </form>
        )}

        {activeTab === "security" && (
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-slate-900 dark:text-white">
                  <QrCode className="h-5 w-5 text-brand-600" /> Autenticazione a Due Fattori (2FA TOTP)
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Proteggi il tuo account con un codice temporaneo a 6 cifre generato da Google Authenticator, Microsoft Authenticator, Apple Password o Authy.
                </p>
              </div>

              {twoFactorEnabled ? (
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  disabled={loading2FA}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40"
                >
                  Disattiva 2FA
                </button>
              ) : !qrCodeDataUrl ? (
                <button
                  type="button"
                  onClick={handleStart2FASetup}
                  disabled={loading2FA}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  {loading2FA ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  Configura 2FA con QR Code
                </button>
              ) : null}
            </div>

            {twoFactorError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
                {twoFactorError}
              </div>
            )}

            {twoFactorSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800">
                {twoFactorSuccess}
              </div>
            )}

            {qrCodeDataUrl && (
              <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-12 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col items-center justify-center space-y-3 md:col-span-5">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code 2FA TOTP"
                    className="h-48 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
                  />
                  <div className="text-center">
                    <p className="text-[11px] text-slate-400">
                      Chiave segreta manuale (Base32):
                    </p>
                    <code className="mt-0.5 block rounded bg-slate-200 px-2 py-1 font-mono text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {secretBase32}
                    </code>
                  </div>
                </div>

                <div className="space-y-4 md:col-span-7">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      1. Scansiona il QR Code e salva i Codici di Recupero
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Se perdi lo smartphone potrai usare uno di questi 8 codici monouso per accedere:
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
                      {backupCodes.map((code) => (
                        <span
                          key={code}
                          className="rounded bg-slate-100 px-2 py-1 text-center font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleConfirmEnable2FA} className="space-y-3">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      2. Inserisci il codice a 6 cifre mostrato nell&apos;app per attivare il 2FA:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        placeholder="123456"
                        className="w-44 rounded-xl border border-slate-200 bg-white px-4 py-2 text-center font-mono text-base tracking-widest dark:border-slate-800 dark:bg-slate-900"
                      />
                      <button
                        type="submit"
                        disabled={loading2FA}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Verifica e Attiva 2FA
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

