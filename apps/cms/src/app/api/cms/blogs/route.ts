import { NextResponse, type NextRequest } from "next/server";
import { getAllBlogs, saveBlog } from "@qafnest/shared/blogStore";
import type { SharedBlogPost } from "@qafnest/shared";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    let blogs = getAllBlogs();

    if (status) {
      blogs = blogs.filter((b) => b.status === status);
    }
    if (category && category !== "all") {
      blogs = blogs.filter((b) => b.category === category);
    }

    return NextResponse.json(blogs);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SharedBlogPost;
    if (!body || !body.titleEn || !body.titleAr) {
      return NextResponse.json({ error: "Missing required blog titles" }, { status: 400 });
    }

    // Auto-generate slug if missing
    if (!body.slug) {
      body.slug = body.titleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    if (!body.id) {
      body.id = `blog-${Date.now()}`;
    }

    const success = saveBlog(body);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist blog" }, { status: 500 });
    }

    return NextResponse.json({ success: true, blog: body });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
