import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminApi";
import {
  getAdminCoupons,
  createAdminCouponRecord,
  updateAdminCouponRecord,
  deleteAdminCouponRecord,
  type AdminCouponRecord,
} from "@/lib/services/adminCouponsService";

export type { AdminCouponRecord };

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const result = await getAdminCoupons();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const coupon = await createAdminCouponRecord(body);
    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "invalid_request", message: err instanceof Error ? err.message : "Error creating coupon" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ code: "missing_id" }, { status: 400 });
    }

    const coupon = await updateAdminCouponRecord(id, body);
    if (!coupon) {
      return NextResponse.json({ code: "coupon_not_found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, coupon });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "invalid_request", message: err instanceof Error ? err.message : "Error updating coupon" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ code: "missing_id" }, { status: 400 });
  }

  await deleteAdminCouponRecord(id);
  return NextResponse.json({ success: true, id });
}
