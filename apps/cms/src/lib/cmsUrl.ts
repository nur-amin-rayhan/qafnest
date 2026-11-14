export const CMS_BASE_PATH = "";

export function cmsPath(route: string): string {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  if (!CMS_BASE_PATH) return normalized;
  if (normalized === CMS_BASE_PATH || normalized.startsWith(`${CMS_BASE_PATH}/`)) {
    return normalized;
  }
  return `${CMS_BASE_PATH}${normalized}`;
}
