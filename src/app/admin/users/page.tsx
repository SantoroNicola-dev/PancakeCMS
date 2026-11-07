"use client";

import React, { useEffect, useState } from "react";
import {
  KeyRound,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { formatDateIt } from "@/lib/utils";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "AUTHOR" | "READER";
  jobTitle: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  forceTwoFactor: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { posts: number; comments: number; bookmarks: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);

  // Create User Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EDITOR" | "AUTHOR" | "READER">(
    "AUTHOR"
  );
  const [jobTitle, setJobTitle] = useState("");
  const [forceTwoFactor, setForceTwoFactor] = useState(false);

  const loadUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        jobTitle,
        forceTwoFactor,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setName("");
      setEmail("");
      setPassword("");
      setJobTitle("");
      setShowCreate(false);
      loadUsers();
    } else {
      alert(data.error || "Errore durante la creazione dell'utente.");
    }
  };

  const handleUpdateUser = async (
    id: string,
    payload: Record<string, unknown>
  ) => {
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    if (res.ok) {
      loadUsers();
    } else {
      const d = await res.json();
      alert(d.error || "Errore.");
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (!window.confirm(`Vuoi eliminare l'account di "${userName}"?`)) return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      loadUsers();
    } else {
      const d = await res.json();
      alert(d.error || "Errore.");
    }
  };

  const filtered = users.filter((u) =>
    roleFilter === "ALL" ? true : u.role === roleFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Utenze, Autorizzazioni (RBAC) &amp; 2FA
          </h1>
          <p className="text-xs text-slate-500">
            Gestisci lo staff del blog (Admin, Editor, Author), la community di Utenti-Lettori (Reader) e i requisiti di autenticazione a due fattori (2FA).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <UserPlus className="h-4 w-4" /> Crea Nuovo Utente / Staff
        </button>
      </div>

      {/* Create User Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateUser}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
            Aggiungi Nuovo Utente o Membro della Redazione
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Chiara Neri"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chiara@blogdisara.it"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Password Iniziale
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 8 caratteri"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Ruolo &amp; Permessi
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="ADMIN">ADMIN (Controllo totale CMS)</option>
                <option value="EDITOR">EDITOR (Tutti i post, media e commenti)</option>
                <option value="AUTHOR">AUTHOR (Solo i propri articoli)</option>
                <option value="READER">READER (Utente-Lettore del blog)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={forceTwoFactor}
                onChange={(e) => setForceTwoFactor(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Richiedi obbligatoriamente l&apos;attivazione del 2FA TOTP al primo login
            </label>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Crea Account
            </button>
          </div>
        </form>
      )}

      {/* Role Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "ALL", label: `Tutti (${users.length})` },
          {
            id: "ADMIN",
            label: `Admin (${users.filter((u) => u.role === "ADMIN").length})`,
          },
          {
            id: "EDITOR",
            label: `Editor (${users.filter((u) => u.role === "EDITOR").length})`,
          },
          {
            id: "AUTHOR",
            label: `Author (${users.filter((u) => u.role === "AUTHOR").length})`,
          },
          {
            id: "READER",
            label: `Utenti-Lettori (${
              users.filter((u) => u.role === "READER").length
            })`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRoleFilter(tab.id)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              roleFilter === tab.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950">
              <tr>
                <th className="px-5 py-3.5">Utente</th>
                <th className="px-4 py-3.5">Ruolo RBAC</th>
                <th className="px-4 py-3.5">Stato 2FA TOTP</th>
                <th className="px-4 py-3.5">Attività</th>
                <th className="px-4 py-3.5">Stato Account</th>
                <th className="px-5 py-3.5 text-right">Azioni Sicurezza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {u.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </td>

                  <td className="px-4 py-4">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleUpdateUser(u.id, { role: e.target.value })
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="AUTHOR">AUTHOR</option>
                      <option value="READER">READER (Lettore)</option>
                    </select>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      {u.twoFactorEnabled ? (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <ShieldCheck className="h-3 w-3" /> 2FA Attivo
                        </span>
                      ) : (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Non attivo
                        </span>
                      )}

                      <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <input
                          type="checkbox"
                          checked={u.forceTwoFactor}
                          onChange={(e) =>
                            handleUpdateUser(u.id, {
                              forceTwoFactor: e.target.checked,
                            })
                          }
                          className="accent-brand-600"
                        />
                        Richiedi 2FA
                      </label>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-500">
                    <p>
                      {u._count.posts} post • {u._count.comments} commenti •{" "}
                      {u._count.bookmarks} salvati
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Registrato il {formatDateIt(u.createdAt)}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateUser(u.id, { isActive: !u.isActive })
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        u.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {u.isActive ? (
                        <>
                          <UserCheck className="h-3 w-3" /> Attivo
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3" /> Sospeso
                        </>
                      )}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {u.twoFactorEnabled && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Vuoi resettare il 2FA per ${u.name}?`
                              )
                            ) {
                              handleUpdateUser(u.id, { resetTwoFactor: true });
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
                          title="Reset 2FA in caso di smarrimento dispositivo"
                        >
                          <RotateCcw className="h-3 w-3" /> Reset 2FA
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-rose-300 hover:text-rose-600"
                        title="Elimina utente"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

