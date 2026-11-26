import { NextResponse, type NextRequest } from "next/server";
import { getAllBlogs, saveBlog } from "@qafnest/shared/blogStore";
import { hydrateSharedJsonFile, persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { sanitizeRichHtml } from "@qafnest/shared/sanitizeRichHtml";
import type { SharedBlogPost } from "@qafnest/shared";
import { isAdminRequest } from "@/lib/adminApi";

const BLOGS_FILE = "cms-blogs.json";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await hydrateSharedJsonFile<SharedBlogPost[]>(BLOGS_FILE, () => []);
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
    console.error("[cms blogs GET] error:", err);
    return NextResponse.json({ error: "Failed to load blogs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await hydrateSharedJsonFile<SharedBlogPost[]>(BLOGS_FILE, () => []);
    const body = (await request.json()) as SharedBlogPost;
    const titleEn = (body?.titleEn || body?.titleAr || "").trim();
    const titleAr = (body?.titleAr || body?.titleEn || "").trim();
    if (!body || (!titleEn && !titleAr)) {
      return NextResponse.json({ error: "Missing required blog title" }, { status: 400 });
    }
    body.titleEn = titleEn;
    body.titleAr = titleAr;

    if (!body.slug) {
      body.slug = body.titleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    if (!body.id) {
      body.id = `blog-${Date.now()}`;
    }

    const sanitizedPost: SharedBlogPost = {
      ...body,
      contentHtmlEn: sanitizeRichHtml(body.contentHtmlEn || (body as any).contentEn || ""),
      contentHtmlAr: sanitizeRichHtml(body.contentHtmlAr || (body as any).contentAr || ""),
    };

    const success = saveBlog(sanitizedPost);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist blog" }, { status: 500 });
    }
    await persistSharedJsonFile(BLOGS_FILE, getAllBlogs());

    return NextResponse.json({ success: true, blog: sanitizedPost });
  } catch (err: unknown) {
    console.error("[cms blogs POST] error:", err);
    return NextResponse.json({ error: "Failed to save blog." }, { status: 500 });
  }
}
