import React from "react";
import { PostEditorWorkspace } from "@/components/editor/PostEditorWorkspace";

export default function NewPostPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const defaultType = searchParams.type === "PAGE" ? "PAGE" : "POST";
  return <PostEditorWorkspace defaultType={defaultType} />;
}

