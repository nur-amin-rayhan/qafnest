import path from "path";
import { BlogSeoConfig, SharedBlogPost } from "./blogTypes";
import { readSharedJsonFile, writeSharedJsonFile } from "./serverJsonStore";

export type { BlogSeoConfig, SharedBlogPost };

const BLOGS_FILE_NAME = "cms-blogs.json";

export const INITIAL_SHARED_BLOGS: SharedBlogPost[] = [];

export function getAllBlogs(): SharedBlogPost[] {
  return readSharedJsonFile<SharedBlogPost[]>(
    BLOGS_FILE_NAME,
    () => [],
    (parsed) => {
      if (Array.isArray(parsed)) {
        return parsed as SharedBlogPost[];
      }
      return [];
    },
    [path.resolve(__dirname, "./data")]
  );
}

export function getBlogBySlug(slug: string): SharedBlogPost | null {
  const blogs = getAllBlogs();
  const cleanSlug = slug.toLowerCase();
  if (cleanSlug === "jeddah-beachfront-villas-guide") {
    return blogs.find((b) => b.slug.toLowerCase() === "obhur-private-beach-villas-jeddah-coastal-living") || null;
  }
  return blogs.find((b) => b.slug.toLowerCase() === cleanSlug) || null;
}

export function getBlogById(id: string): SharedBlogPost | null {
  const blogs = getAllBlogs();
  return blogs.find((b) => b.id === id) || null;
}

export function saveBlog(post: SharedBlogPost): boolean {
  const blogs = [...getAllBlogs()];
  const existingIndex = blogs.findIndex((b) => b.id === post.id);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    blogs[existingIndex] = {
      ...post,
      updatedAt: now,
    };
  } else {
    blogs.unshift({
      ...post,
      createdAt: post.createdAt || now,
      updatedAt: now,
    });
  }

  return writeSharedJsonFile(BLOGS_FILE_NAME, blogs);
}

export function deleteBlog(id: string): boolean {
  const filtered = getAllBlogs().filter((b) => b.id !== id);
  return writeSharedJsonFile(BLOGS_FILE_NAME, filtered);
}
