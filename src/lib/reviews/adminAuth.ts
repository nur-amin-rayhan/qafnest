import { getReviewAuthContext, ReviewAuthError } from "@/lib/reviews/serverAuth";

export { ReviewAuthError };

export async function getReviewAdminContext(request: Request) {
  const auth = await getReviewAuthContext(request);
  if (!auth) return null;

  const { data, error } = await auth.supabase
    .from("review_admins")
    .select("auth_subject, display_name")
    .eq("auth_subject", auth.subject)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...auth,
    adminDisplayName: data.display_name,
  };
}
