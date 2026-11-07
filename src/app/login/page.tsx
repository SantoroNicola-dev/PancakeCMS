"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "2fa">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Credenziali non valide.");
        return;
      }

      if (data.requiresTwoFactor) {
        setMode("2fa");
        return;
      }

      if (data.mustSetup2FA) {
        router.push("/account?setup2fa=1");
        router.refresh();
        return;
      }

      if (data.user?.role === "READER") {
        router.push("/account");
      } else {
        router.push("/admin");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Codice 2FA non valido.");
        return;
      }

      if (data.user?.role === "READER") {
        router.push("/account");
      } else {
        router.push("/admin");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore durante la registrazione.");
        return;
      }

      router.push("/account");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setMode("login");
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Torna a Il Blog di Sara
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Protetto con 2FA TOTP
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {mode !== "2fa" && (
            <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2 font-semibold transition ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500"
                }`}
              >
                Accedi (Staff &amp; Lettori)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2 font-semibold transition ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500"
                }`}
              >
                Registrati come Lettore
              </button>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h1 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                  Bentornato su PancakeCMS
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Accedi al pannello editoriale o alla tua area lettore personale.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Indirizzo Email
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sara@blogdisara.it"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Accedi ora
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h1 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                  Unisciti alla Community Lettori
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Commenta gli articoli, salva i tuoi pezzi preferiti e attiva il 2FA sul tuo profilo.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nome e Cognome
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Giulia Conti"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Indirizzo Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="giulia@example.it"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password (min. 8 caratteri)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Almeno 8 caratteri"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Crea Account Lettore
              </button>
            </form>
          )}

          {mode === "2fa" && (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  Verifica a Due Fattori (2FA)
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Inserisci il codice a 6 cifre generato dalla tua app Authenticator (Google/Microsoft Authenticator, Authy) oppure uno dei tuoi codici di recupero.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}

              <input
                type="text"
                required
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456 oppure XXXX-XXXX"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-lg tracking-widest focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
              />

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verifica Codice 2FA
              </button>

              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600"
              >
                Torna al login
              </button>
            </form>
          )}
        </div>

        {/* Demo Quick Login Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Sparkles className="h-4 w-4 text-brand-600" /> Accesso Rapido Demo (4 Ruoli Preconfigurati)
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Clicca su un ruolo per compilare istantaneamente le credenziali di test:
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                fillDemoAccount("sara@blogdisara.it", "SaraAdmin2026!")
              }
              className="rounded-xl border border-brand-200 bg-brand-50/70 p-2.5 text-left hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/40"
            >
              <p className="font-bold text-brand-700 dark:text-brand-300">
                👑 Sara Rossi (ADMIN)
              </p>
              <p className="truncate text-[10px] text-slate-500">
                Accesso totale CMS &amp; Impostazioni
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                fillDemoAccount("editor@blogdisara.it", "Editor2026!")
              }
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="font-bold text-slate-800 dark:text-slate-200">
                ✍️ Marco (EDITOR)
              </p>
              <p className="truncate text-[10px] text-slate-500">
                Gestisce tutti i post, media e commenti
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                fillDemoAccount("autore@blogdisara.it", "Autore2026!")
              }
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="font-bold text-slate-800 dark:text-slate-200">
                📝 Elena (AUTHOR)
              </p>
              <p className="truncate text-[10px] text-slate-500">
                Scrive e gestisce i propri articoli
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                fillDemoAccount("lettore@blogdisara.it", "Lettore2026!")
              }
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="font-bold text-slate-800 dark:text-slate-200">
                📖 Luca (READER)
              </p>
              <p className="truncate text-[10px] text-slate-500">
                Commenti, Like, Segnalibri &amp; 2FA
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

