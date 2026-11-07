import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostEditorWorkspace } from "@/components/editor/PostEditorWorkspace";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      tags: true,
      revisions: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 15,
      },
    },
  });

  if (!post) notFound();

  return (
    <PostEditorWorkspace
      initialPost={{
        ...post,
        scheduledFor: post.scheduledFor
          ? post.scheduledFor.toISOString()
          : null,
        revisions: post.revisions.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      }}
    />
  );
}

