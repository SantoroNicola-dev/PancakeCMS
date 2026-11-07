"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ExternalLink,
  FilePlus2,
  FileText,
  FolderTree,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

interface AdminSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "EDITOR" | "AUTHOR" | "READER";
    twoFactorEnabled: boolean;
  };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: "Panoramica & Statistiche",
      href: "/admin",
      icon: LayoutDashboard,
      roles: ["ADMIN", "EDITOR", "AUTHOR"],
    },
    {
      label: "Articoli & Pagine",
      href: "/admin/posts",
      icon: FileText,
      roles: ["ADMIN", "EDITOR", "AUTHOR"],
    },
    {
      label: "Nuovo Articolo WYSIWYG",
      href: "/admin/posts/new",
      icon: FilePlus2,
      roles: ["ADMIN", "EDITOR", "AUTHOR"],
    },
    {
      label: "Media & Editor Immagini",
      href: "/admin/media",
      icon: ImageIcon,
      roles: ["ADMIN", "EDITOR", "AUTHOR"],
    },
    {
      label: "Categorie & Tag (#Interni)",
      href: "/admin/taxonomies",
      icon: FolderTree,
      roles: ["ADMIN", "EDITOR", "AUTHOR"],
    },
    {
      label: "Moderazione Commenti",
      href: "/admin/comments",
      icon: MessageSquare,
      roles: ["ADMIN", "EDITOR"],
    },
    {
      label: "Utenti, Lettori & 2FA",
      href: "/admin/users",
      icon: Users,
      roles: ["ADMIN"],
    },
    {
      label: "SEO, Google Analytics & Sito",
      href: "/admin/settings",
      icon: BarChart3,
      roles: ["ADMIN"],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex w-full flex-col justify-between border-b border-slate-200 bg-white p-4 lg:w-64 lg: shrink-0 lg:border-b-0 lg:border-r dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-between px-2">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-serif text-lg font-bold text-white shadow-sm">
              🥞
            </span>
            <div>
              <p className="font-serif text-base font-bold text-slate-900 dark:text-white">
                PancakeCMS
              </p>
              <p className="text-[11px] font-medium text-slate-400">
                Studio Editoriale
              </p>
            </div>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
            title="Apri il Blog pubblico"
          >
            Blog <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="mt-6 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="flex items-center justify-between px-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-400">Ruolo: {user.role}</p>
          </div>
          {user.twoFactorEnabled && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              title="2FA TOTP Attivo"
            >
              <ShieldCheck className="h-3 w-3" /> 2FA
            </span>
          )}
        </div>

        <div className="flex gap-1.5">
          <Link
            href="/account"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
          >
            <KeyRound className="h-3.5 w-3.5" /> Profilo &amp; 2FA
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800"
            title="Esci"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

