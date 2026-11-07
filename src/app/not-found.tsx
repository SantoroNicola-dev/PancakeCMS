import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-4 font-serif text-3xl font-bold text-slate-900 dark:text-white">
        Pagina non trovata (404)
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        L&apos;articolo o la pagina che stai cercando potrebbe essere stato spostato o rimosso.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Torna alla Home Page
      </Link>
    </div>
  );
}

