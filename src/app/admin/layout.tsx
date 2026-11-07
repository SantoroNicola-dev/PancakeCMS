import React from "react";
import { redirect } from "next/navigation";
import { canAccessAdmin, getSessionUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!canAccessAdmin(user.role)) {
    redirect("/account");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 lg:flex-row dark:bg-slate-950">
      <AdminSidebar user={user} />
      <div className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}

