import { NextResponse, type NextRequest } from "next/server";
import { getAllBlogs, getBlogById, saveBlog, deleteBlog } from "@qafnest/shared/blogStore";
import { hydrateSharedJsonFile, persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { sanitizeRichHtml } from "@qafnest/shared/escapeHtml";
import type { SharedBlogPost } from "@qafnest/shared";
import { isAdminRequest } from "@/lib/adminApi";

const BLOGS_FILE = "cms-blogs.json";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await hydrateSharedJsonFile<SharedBlogPost[]>(BLOGS_FILE, () => []);
    const blog = getBlogById(params.id);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json(blog);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await hydrateSharedJsonFile<SharedBlogPost[]>(BLOGS_FILE, () => []);
    const body = (await request.json()) as SharedBlogPost;
    const sanitizedPost: SharedBlogPost = {
      ...body,
      id: params.id,
      contentHtmlEn: sanitizeRichHtml(body.contentHtmlEn || (body as any).contentEn || ""),
      contentHtmlAr: sanitizeRichHtml(body.contentHtmlAr || (body as any).contentAr || ""),
    };
    const success = saveBlog(sanitizedPost);
    if (!success) {
      return NextResponse.json({ error: "Failed to update blog" }, { status: 500 });
    }
    await persistSharedJsonFile(BLOGS_FILE, getAllBlogs());
    return NextResponse.json({ success: true, blog: sanitizedPost });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await hydrateSharedJsonFile<SharedBlogPost[]>(BLOGS_FILE, () => []);
    const success = deleteBlog(params.id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
    }
    await persistSharedJsonFile(BLOGS_FILE, getAllBlogs());
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
