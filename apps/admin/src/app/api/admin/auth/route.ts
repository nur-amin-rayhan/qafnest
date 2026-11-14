import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_COOKIE_NAME,
  COOKIE_MAX_AGE,
  signAdminToken,
  verifyAdminToken,
} from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ADMIN_SECRET_KEY?.trim() || process.env.ADMIN_SECRET_KEY.trim().length < 32) {
      return NextResponse.json(
        { code: "admin_auth_not_configured", message: "Set a random ADMIN_SECRET_KEY with at least 32 characters." },
        { status: 503 }
      );
    }
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { code: "invalid_credentials", message: "Email and password are required." },
        { status: 400 }
      );
    }

    const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredAdminPassword = process.env.ADMIN_PASSWORD;

    let isValid = false;
    let adminName = "Master Administrator";

    // 1. Check Master Configured Admin Credentials
    if (configuredAdminEmail && configuredAdminPassword && email === configuredAdminEmail && password === configuredAdminPassword) {
      isValid = true;
      adminName = "Super Admin";
    }

    // 2. Also check Supabase Auth for team staff users
    if (!isValid) {
      try {
        const supabase = await createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!authError && authData.user) {
          // Verify user role in profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", authData.user.id)
            .maybeSingle();

          const userRole =
            authData.user.app_metadata?.role ||
            authData.user.user_metadata?.role;

          if (userRole === "admin") {
            isValid = true;
            adminName = profile?.full_name || authData.user.email?.split("@")[0] || "Operations Admin";
          }
        }
      } catch (err) {
        console.warn("Notice: Supabase auth fallback check:", err);
      }
    }

    if (!isValid) {
      return NextResponse.json(
        {
          code: "unauthorized",
          message: "Invalid email or password. Access restricted to authorized personnel.",
        },
        { status: 401 }
      );
    }

    // Generate signed admin session token
    const exp = Date.now() + COOKIE_MAX_AGE * 1000;
    const token = signAdminToken({ email, role: "admin", exp });

    const response = NextResponse.json({
      success: true,
      user: {
        email,
        name: adminName,
        role: "admin",
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ code: "server_error", message: "Internal server error." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = verifyAdminToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: payload.email,
      role: payload.role,
      name: "Operations Administrator",
    },
  });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
