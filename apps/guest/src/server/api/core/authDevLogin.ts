import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Development login is disabled in production." },
      { status: 404 }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const submittedEmail =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const submittedPassword =
    typeof body.password === "string" ? body.password : "";

  const expectedEmail = (
    process.env.DEV_GUEST_EMAIL ||
    process.env.NEXT_PUBLIC_DEV_GUEST_EMAIL ||
    ""
  )
    .trim()
    .toLowerCase();
  const expectedPassword =
    process.env.DEV_GUEST_PASSWORD ||
    process.env.NEXT_PUBLIC_DEV_GUEST_PASSWORD ||
    "";

  if (
    !expectedEmail ||
    !expectedPassword ||
    submittedEmail !== expectedEmail ||
    submittedPassword !== expectedPassword
  ) {
    return NextResponse.json(
      { error: "Invalid development guest credentials." },
      { status: 401 }
    );
  }

  const devGuestId =
    process.env.NEXT_PUBLIC_DEV_GUEST_ID || "00000000-0000-0000-0000-000000000001";
  const devGuestName =
    process.env.NEXT_PUBLIC_DEV_GUEST_NAME || "Dev Guest User";
  const devGuestPhone = process.env.NEXT_PUBLIC_DEV_GUEST_PHONE || "";

  const user = {
    id: devGuestId,
    email: expectedEmail,
    phone: devGuestPhone || undefined,
    app_metadata: { provider: "email", role: "guest" },
    user_metadata: {
      full_name: devGuestName,
      contact_email: expectedEmail,
      phone: devGuestPhone || null,
      role: "guest",
    },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };

  const profile = {
    id: devGuestId,
    full_name: devGuestName,
    phone: devGuestPhone || null,
    avatar_url: null,
    contact_email: expectedEmail,
    role: "guest" as const,
  };

  const response = NextResponse.json({ success: true, user, profile });
  response.cookies.set("qafnest_has_session", "dev_guest_token", {
    path: "/",
    maxAge: 86400,
    sameSite: "lax",
  });
  return response;
}
