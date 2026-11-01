export function propertyDetailHref(propertyId: string, search?: URLSearchParams | string) {
  const query = typeof search === "string" ? search : search?.toString() || "";
  return `/property/${encodeURIComponent(propertyId)}${query ? `?${query}` : ""}`;
}

export function propertyReservationHref(propertyId: string, search?: URLSearchParams | string) {
  const query = typeof search === "string" ? search : search?.toString() || "";
  const path = `/property/${encodeURIComponent(propertyId)}/reserve`;
  return `${path}${query ? `?${query}` : ""}`;
}
