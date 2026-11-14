import { NextResponse, type NextRequest } from "next/server";
import { getBlogById, saveBlog, deleteBlog } from "@qafnest/shared/blogStore";
import type { SharedBlogPost } from "@qafnest/shared";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
  try {
    const body = (await request.json()) as SharedBlogPost;
    body.id = params.id;
    const success = saveBlog(body);
    if (!success) {
      return NextResponse.json({ error: "Failed to update blog" }, { status: 500 });
    }
    return NextResponse.json({ success: true, blog: body });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = deleteBlog(params.id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
