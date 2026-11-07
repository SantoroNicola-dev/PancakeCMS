import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin, canManageTaxonomies, getSessionUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true } },
        _count: { select: { posts: true } },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
    prisma.tag.findMany({
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: [{ isInternal: "asc" }, { name: "asc" }],
    }),
  ]);

  return NextResponse.json({ categories, tags });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { entity, action = "create" } = body;

    if (entity === "category") {
      if (!canManageTaxonomies(user.role)) {
        return NextResponse.json(
          { error: "Solo Admin ed Editor possono gestire le categorie." },
          { status: 403 }
        );
      }

      if (action === "delete") {
        await prisma.category.delete({ where: { id: String(body.id) } });
        return NextResponse.json({ success: true });
      }

      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Nome categoria richiesto." }, { status: 400 });
      }
      const slug = slugify(body.slug || name);

      if (action === "update" && body.id) {
        const category = await prisma.category.update({
          where: { id: String(body.id) },
          data: {
            name,
            slug,
            description: body.description || null,
            color: body.color || "#c54c3d",
            parentId: body.parentId || null,
            seoTitle: body.seoTitle || null,
            seoDescription: body.seoDescription || null,
          },
        });
        return NextResponse.json({ category });
      }

      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description: body.description || null,
          color: body.color || "#c54c3d",
          parentId: body.parentId || null,
          seoTitle: body.seoTitle || null,
          seoDescription: body.seoDescription || null,
        },
      });
      return NextResponse.json({ category });
    }

    if (entity === "tag") {
      if (action === "delete") {
        if (!canManageTaxonomies(user.role)) {
          return NextResponse.json(
            { error: "Solo Admin ed Editor possono eliminare i tag." },
            { status: 403 }
          );
        }
        await prisma.tag.delete({ where: { id: String(body.id) } });
        return NextResponse.json({ success: true });
      }

      const isInternal = Boolean(body.isInternal);
      let name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Nome tag richiesto." }, { status: 400 });
      }
      if (isInternal && !name.startsWith("#")) {
        name = `#${name}`;
      }

      const baseSlug = slugify(body.slug || name.replace(/^#/, ""));
      const slug = isInternal && !baseSlug.startsWith("int-") ? `int-${baseSlug}` : baseSlug;

      if (action === "update" && body.id) {
        const tag = await prisma.tag.update({
          where: { id: String(body.id) },
          data: {
            name,
            slug,
            description: body.description || null,
            color: body.color || (isInternal ? "#e11d48" : "#64748b"),
            isInternal,
          },
        });
        return NextResponse.json({ tag });
      }

      const tag = await prisma.tag.upsert({
        where: { slug },
        update: {
          name,
          description: body.description || null,
          color: body.color || (isInternal ? "#e11d48" : "#64748b"),
          isInternal,
        },
        create: {
          name,
          slug,
          description: body.description || null,
          color: body.color || (isInternal ? "#e11d48" : "#64748b"),
          isInternal,
        },
      });
      return NextResponse.json({ tag });
    }

    return NextResponse.json({ error: "Entità non valida." }, { status: 400 });
  } catch (err) {
    console.error("Taxonomy API error:", err);
    return NextResponse.json(
      { error: "Errore nella gestione di categorie e tag." },
      { status: 500 }
    );
  }
}

