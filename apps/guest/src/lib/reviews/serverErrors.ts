type ReviewDatabaseError = {
  code?: unknown;
  message?: unknown;
};

export function isReviewSchemaUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const databaseError = error as ReviewDatabaseError;
  const code = typeof databaseError.code === "string" ? databaseError.code : "";
  const message = typeof databaseError.message === "string" ? databaseError.message : "";
  return ["PGRST202", "PGRST204", "PGRST205", "42P01", "42703", "42883"].includes(code) ||
    /could not find the function|relation .* does not exist|column .* does not exist/i.test(message);
}
