import { notFound, permanentRedirect, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CatchAllRedirectPage({
  params,
}: {
  params: { legacyPath: string[] };
}) {
  const pathStr = "/" + (params.legacyPath || []).join("/");

  const rule = await prisma.redirect.findUnique({
    where: { sourcePath: pathStr },
  });

  if (rule && rule.isActive) {
    await prisma.redirect
      .update({
        where: { id: rule.id },
        data: { hits: { increment: 1 } },
      })
      .catch(() => {});

    if (rule.statusCode === 301) {
      permanentRedirect(rule.destinationPath);
    } else {
      redirect(rule.destinationPath);
    }
  }

  notFound();
}

