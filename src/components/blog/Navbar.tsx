"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Palette,
  Search,
  ShieldCheck,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";
import { getButtonRadiusClass, getContainerWidthClass } from "@/lib/theme";

interface MenuItem {
  label: string;
  href: string;
}

interface NavbarProps {
  siteName: string;
  logoText: string;
  headerMenu: MenuItem[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "EDITOR" | "AUTHOR" | "READER";
    avatarUrl?: string | null;
    twoFactorEnabled?: boolean;
  } | null;
  settings?: Record<string, any> | null;
}

export function Navbar({
  siteName,
  logoText,
  headerMenu,
  currentUser,
  settings,
}: NavbarProps) {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; title: string; slug: string; excerpt: string | null }[]
  >([]);

  const s = settings || {};
  const navbarStyle = s.navbarStyle || "classic";
  const stickyNavbar = s.stickyNavbar ?? true;
  const allowThemeToggle = s.allowThemeToggle ?? true;
  const defaultThemeMode = s.defaultThemeMode || "system";
  const logoType = s.logoType || "text";
  const logoImageUrl = s.logoImageUrl || "";
  const logoDarkImageUrl = s.logoDarkImageUrl || "";
  const logoHeight = Number(s.logoHeight) || 36;
  const showSiteNameInNavbar = s.showSiteNameInNavbar ?? true;
  const containerClass = getContainerWidthClass(s.containerWidth);
  const btnRadius = getButtonRadiusClass(s.buttonStyle);

  useEffect(() => {
    const stored = localStorage.getItem("pancakecms_theme");
    let isDark = false;
    if (
      !allowThemeToggle &&
      (defaultThemeMode === "light" || defaultThemeMode === "dark")
    ) {
      isDark = defaultThemeMode === "dark";
    } else if (stored === "dark" || stored === "light") {
      isDark = stored === "dark";
    } else if (defaultThemeMode === "dark") {
      isDark = true;
    } else if (defaultThemeMode === "light") {
      isDark = false;
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
}, [allowThemeToggle, defaultThemeMode]);

const toggleDark = () => {
  const next = !dark;
  setDark(next);
  localStorage.setItem("pancakecms_theme", next ? "dark" : "light");
  document.documentElement.classList.toggle("dark", next);
};

useEffect(() => {
  if (!searchQuery.trim()) {
    setSearchResults([]);
    return;
  }
  const timer = setTimeout(async () => {
    const res = await fetch(
      `/api/posts?q=${encodeURIComponent(searchQuery.trim())}`
    );
    const data = await res.json();
    setSearchResults(data.posts?.slice(0, 6) || []);
  }, 220);
  return () => clearTimeout(timer);
}, [searchQuery]);

const handleLogout = async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  router.refresh();
};

const isStaff =
  currentUser &&
  (currentUser.role === "ADMIN" ||
    currentUser.role === "EDITOR" ||
    currentUser.role === "AUTHOR");

        const activeLogoSrc =
        dark && logoDarkImageUrl ? logoDarkImageUrl : logoImageUrl;

  const renderBrandLogo = (large = false) => (
        <Link href="/" className="group inline-flex items-center gap-2.5">
          {(logoType === "image" || logoType === "both") && activeLogoSrc ? (
            <img
              src={activeLogoSrc}
              alt={siteName}
              style={{ height: `${large ? Math.round(logoHeight * 1.25) : logoHeight}px` }}
              className="w-auto object-contain transition group-hover:opacity-90"
            />
          ) : null}

              {(logoType === "text" ||
                logoType === "both" ||
                !activeLogoSrc) && (
                <span
                  className={`font-serif font-bold tracking-tight text-slate-900 transition group-hover:text-brand-600 dark:text-white ${large ? "text-3xl sm:text-4xl" : "text-2xl"
                    }`}
                >
                  {logoText || siteName}
                </span>
              )}

              {showSiteNameInNavbar && !large && (
                <span className="hidden text-xs font-medium text-slate-400 lg:inline">
                  {siteName}
                </span>
              )}
    </Link>
        );

  const renderRightActions = () => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={`inline-flex items-center gap-2 ${btnRadius} border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400`}
            aria-label="Cerca nel blog"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cerca...</span>
          </button>

          {allowThemeToggle && (
            <button
              type="button"
              onClick={toggleDark}
              className={`${btnRadius} border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800`}
              aria-label="Cambia tema chiaro/scuro"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-1.5">
              {currentUser.role === "ADMIN" && (
            <Link
              href="/admin/appearance"
              className={`hidden xl:inline-flex items-center gap-1.5 ${btnRadius} border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-300`}
              title="Personalizza Aspetto, Tema & Layout 360°"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Design</span>
            </Link>
          )}

            {isStaff && (
            <Link
              href="/admin"
              className={`inline-flex items-center gap-1.5 ${btnRadius} bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CMS Admin</span>
            </Link>
          )}

            <Link
              href="/account"
              className={`inline-flex items-center gap-1.5 ${btnRadius} border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200`}
              title="Area Lettore, Preferiti e Sicurezza 2FA"
            >
              <Bookmark className="h-3.5 w-3.5 text-brand-600" />
              <span className="max-w-[96px] truncate">
                {currentUser.name.split(" ")[0]}
              </span>
              {currentUser.twoFactorEnabled && (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className={`${btnRadius} p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800`}
              title="Esci"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className={`inline-flex items-center gap-1.5 ${btnRadius} bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900`}
          >
            <UserIcon className="h-3.5 w-3.5" /> Accedi / Registrati
          </Link>
        )}

      <button
        type="button"
        onClick={() => setMobileOpen((m) => !m)}
        className="rounded-lg p-2 text-slate-600 md:hidden dark:text-slate-300"
        aria-label="Menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </div>
    );

    const headerStickyClass = stickyNavbar ? "sticky top-0 z-30" : "relative z-30";

    return (
    <>
      {/* Optional Top Announcement Bar */}
      {s.enableAnnouncementBar && s.announcementText && (
        <div
          style={{
            backgroundColor: s.announcementBgColor || "#c54c3d",
            color: s.announcementTextColor || "#ffffff",
          }}
          className="px-4 py-2 text-center text-xs font-medium"
        >
          <div
            className={`mx-auto flex ${containerClass} flex-wrap items-center justify-center gap-2`}
          >
            <span>{s.announcementText}</span>
            {s.announcementLinkText && s.announcementLinkUrl && (
              <Link
                href={s.announcementLinkUrl}
                className="inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:opacity-90"
              >
                {s.announcementLinkText} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

            {navbarStyle === "floating" ? (
              <div className={`${headerStickyClass} px-4 pt-3 sm:px-6`}>
                <header
                  className={`mx-auto ${containerClass} rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6 dark:border-slate-800/80 dark:bg-slate-900/90`}
                >
                  <div className="flex items-center justify-between">
                    {renderBrandLogo(false)}
                    <nav className="hidden items-center gap-6 md:flex">
                      {headerMenu.map((item, idx) => (
                        <Link
                          key={idx}
                          href={item.href}
                          className="text-sm font-medium text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                    {renderRightActions()}
                  </div>
                </header>
              </div>
            ) : navbarStyle === "centered" ? (
              <header
                className={`${headerStickyClass} border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95`}
              >
                <div className={`mx-auto ${containerClass} px-4 sm:px-6`}>
                  <div className="flex items-center justify-between py-4">
                    <div className="hidden text-xs font-medium text-slate-400 md:block">
                      {siteName}
                    </div>
                    <div className="flex-1 text-left md:text-center">
                      {renderBrandLogo(true)}
                    </div>
                    {renderRightActions()}
                  </div>
                  <nav className="hidden items-center justify-center gap-8 border-t border-slate-100 py-2.5 md:flex dark:border-slate-800/80">
                    {headerMenu.map((item, idx) => (
                      <Link
                        key={idx}
                        href={item.href}
                        className="text-xs font-semibold uppercase tracking-wider text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
                      >
                        {item.label}
                      </Link>
                    ))}
              </nav>
          </div>
        </header>
    ) : (
    <header
      className={`${headerStickyClass} border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90`}
    >
      <div
        className={`mx-auto flex ${containerClass} items-center justify-between px-4 ${navbarStyle === "minimal" ? "py-2.5" : "py-4"
          } sm:px-6`}
      >
        {renderBrandLogo(false)}

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {headerMenu.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {renderRightActions()}
      </div>
    </header>
      )}

    {/* Mobile Nav */}
    {mobileOpen && (
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col space-y-2.5">
          {headerMenu.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    )}

    {/* Instant Search Modal */}
    {searchOpen && (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20 backdrop-blur-sm">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
            <Search className="h-5 w-5 text-brand-600" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca articoli, argomenti o parole chiave..."
              className="flex-1 bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-3">
            {!searchQuery.trim() ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Digita una parola chiave per cercare istantaneamente in tutti gli articoli pubblicati.
              </p>
            ) : searchResults.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Nessun articolo trovato per &ldquo;{searchQuery}&rdquo;.
              </p>
            ) : (
              <div className="space-y-1.5">
                {searchResults.map((post) => (
                  <Link
                    key={post.id}
                    href={`/articolo/${post.slug}`}
                    onClick={() => setSearchOpen(false)}
                    className="block rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-white">
                      {post.title}
                    </h4>
                    {post.excerpt && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {post.excerpt}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
);
}
