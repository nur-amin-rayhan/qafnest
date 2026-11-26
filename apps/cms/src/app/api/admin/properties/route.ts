import { NextRequest, NextResponse } from "next/server";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("properties")
    .select("id,title,city,city_name,district,category,base_price,tourism_license_number,host_id,is_approved,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[cms admin properties] read failed:", error);
    return NextResponse.json({ code: "properties_read_failed", message: "Failed to read properties." }, { status: 500 });
  }
  return NextResponse.json({ properties: data || [] });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }
  if (!body.id || (body.status !== "approved" && body.status !== "rejected")) {
    return NextResponse.json({ code: "invalid_property_status" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("properties")
    .update({
      is_approved: body.status === "approved",
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select("id,status,is_approved")
    .single();
  if (error) {
    console.error("[cms admin properties] update failed:", error);
    return NextResponse.json({ code: "property_status_update_failed", message: "Failed to update property status." }, { status: 500 });
  }
  return NextResponse.json({ property: data });
}
