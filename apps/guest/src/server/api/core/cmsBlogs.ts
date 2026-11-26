import { NextResponse, type NextRequest } from "next/server";
import { getAllBlogs, getBlogBySlug } from "@qafnest/shared/blogStore";
import { hydrateSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import type { SharedBlogPost } from "@qafnest/shared";

export async function GET(request: NextRequest) {
  try {
    await hydrateSharedJsonFile<SharedBlogPost[]>("cms-blogs.json", () => []);
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (slug) {
      const blog = getBlogBySlug(slug);
      if (!blog || blog.status === "draft") {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }
      return NextResponse.json(blog, { headers: { "Cache-Control": "no-store" } });
    }
    const blogs = getAllBlogs().filter((b) => b.status !== "draft");
    return NextResponse.json(blogs, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    console.error("[cmsBlogs] load error:", err);
    return NextResponse.json({ error: "Failed to load blog posts." }, { status: 500 });
  }
}
