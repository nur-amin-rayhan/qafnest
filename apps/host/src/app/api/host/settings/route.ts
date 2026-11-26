import { NextRequest, NextResponse } from "next/server";
import { verifyHostSession } from "@/lib/auth/serverAuth";
import {
  getHostSettings,
  updateHostProfileSettings,
  updateHostPayoutSettings,
  updateHostNotificationSettings,
  updateHostPassword,
  terminateOtherSessions,
} from "@/lib/services/hostSettingsService";

export async function GET(request: NextRequest) {
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  try {
    const settings = await getHostSettings(authUser.id);
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    console.error("[host settings GET] error:", err);
    return NextResponse.json(
      { code: "server_error", message: "Error loading settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { code: "invalid_payload", message: "Section and data are required." },
        { status: 400 }
      );
    }

    if (section === "profile") {
      const updatedProfile = await updateHostProfileSettings(authUser.id, data);
      return NextResponse.json({
        success: true,
        message: "Profile details updated successfully.",
        profile: updatedProfile,
      });
    }

    if (section === "payout") {
      const updatedPayout = await updateHostPayoutSettings(authUser.id, data);
      return NextResponse.json({
        success: true,
        message: "Bank account and payout preferences updated successfully.",
        payout: updatedPayout,
      });
    }

    if (section === "notifications") {
      const updatedNotifications = await updateHostNotificationSettings(authUser.id, data);
      return NextResponse.json({
        success: true,
        message: "Notification preferences saved successfully.",
        notifications: updatedNotifications,
      });
    }

    if (section === "security") {
      const { action, password, currentPassword } = data;
      if (action === "update_password") {
        if (!password || password.length < 8) {
          return NextResponse.json(
            { code: "invalid_password", message: "Password must be at least 8 characters long." },
            { status: 400 }
          );
        }
        const result = await updateHostPassword(authUser.id, password, currentPassword);
        return NextResponse.json({
          success: true,
          message: "Password updated successfully.",
          result,
        });
      }

      if (action === "terminate_sessions") {
        const authHeader = request.headers.get("authorization") || "";
        const bearer = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : undefined;
        const result = await terminateOtherSessions(authUser.id, bearer);
        return NextResponse.json({
          success: true,
          message: "All other sessions have been signed out.",
          result,
        });
      }
    }

    return NextResponse.json(
      { code: "invalid_section", message: `Unknown settings section: ${section}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("[host settings PUT] error:", err);
    return NextResponse.json(
      { code: "server_error", message: "Error updating settings." },
      { status: 500 }
    );
  }
}

