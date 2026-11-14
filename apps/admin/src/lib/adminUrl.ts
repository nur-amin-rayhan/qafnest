export const ADMIN_BASE_PATH = "";

export function adminPath(route: string): string {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  if (!ADMIN_BASE_PATH) return normalized;
  if (normalized === ADMIN_BASE_PATH || normalized.startsWith(`${ADMIN_BASE_PATH}/`)) {
    return normalized;
  }
  return `${ADMIN_BASE_PATH}${normalized}`;
}
