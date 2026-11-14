import { adminPath } from "@/lib/adminUrl";
export async function patchSinglePropertyStatus(
  id: string,
  status: "approved" | "rejected" | "pending",
  feedback?: string
) {
  const res = await fetch(adminPath("/api/admin/properties"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      status,
      admin_feedback: feedback,
      rejection_reason: feedback,
    }),
  });
  if (!res.ok) throw new Error("Could not update property status");
  return res.json();
}

export async function patchBulkPropertyStatus(
  ids: string[],
  status: "approved" | "rejected",
  feedback?: string
) {
  const res = await fetch(adminPath("/api/admin/properties"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ids,
      status,
      admin_feedback: feedback,
      rejection_reason: feedback,
    }),
  });
  if (!res.ok) throw new Error("Bulk update failed");
  return res.json();
}

