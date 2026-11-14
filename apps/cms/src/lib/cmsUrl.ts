export const CMS_BASE_PATH = "/cms";

export function cmsPath(route: string): string {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  if (normalized === CMS_BASE_PATH || normalized.startsWith(`${CMS_BASE_PATH}/`)) {
    return normalized;
  }
  return `${CMS_BASE_PATH}${normalized}`;
}
