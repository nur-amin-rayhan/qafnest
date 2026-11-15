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
    process.env.DEV_HOST_EMAIL ||
    process.env.NEXT_PUBLIC_DEV_HOST_EMAIL ||
    ""
  )
    .trim()
    .toLowerCase();
  const expectedPassword =
    process.env.DEV_HOST_PASSWORD ||
    process.env.NEXT_PUBLIC_DEV_HOST_PASSWORD ||
    "";

  if (
    !expectedEmail ||
    !expectedPassword ||
    submittedEmail !== expectedEmail ||
    submittedPassword !== expectedPassword
  ) {
    return NextResponse.json(
      { error: "Invalid development host credentials." },
      { status: 401 }
    );
  }

  const devHostId =
    process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002";
  const devHostName =
    process.env.NEXT_PUBLIC_DEV_HOST_NAME || "Dev Host Partner";
  const devHostPhone = process.env.NEXT_PUBLIC_DEV_HOST_PHONE || "";

  const user = {
    id: devHostId,
    email: expectedEmail,
    phone: devHostPhone || undefined,
    app_metadata: { provider: "email", role: "host" },
    user_metadata: { full_name: devHostName, role: "host", phone: devHostPhone || null },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };

  const profile = {
    id: devHostId,
    full_name: devHostName,
    phone: devHostPhone || null,
    avatar_url: null,
    role: "host" as const,
  };

  const response = NextResponse.json({ success: true, user, profile });
  response.cookies.set("qafnest_host_dev", "1", {
    path: "/",
    maxAge: 86400,
    sameSite: "lax",
  });
  response.cookies.set("qafnest_has_host_session", "dev_host_token", {
    path: "/",
    maxAge: 86400,
    sameSite: "lax",
  });
  return response;
}
