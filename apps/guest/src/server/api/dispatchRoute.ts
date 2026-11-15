import { NextRequest, NextResponse } from "next/server";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteModuleHandler = (request: NextRequest, context?: any) => Promise<Response> | Response;

export type RouteModule = Partial<Record<HttpMethod, RouteModuleHandler>>;

/** Dispatches an HTTP request to a modular API route handler and normalizes 404/405 responses. */
export async function dispatchApiModule(
  routeModule: RouteModule | null,
  request: NextRequest,
  context?: unknown
): Promise<Response> {
  if (!routeModule) {
    return NextResponse.json({ error: "API route not found" }, { status: 404 });
  }

  const method = request.method.toUpperCase() as HttpMethod;
  const handler = routeModule[method];
  if (!handler) {
    return NextResponse.json(
      { error: `Method ${method} not allowed` },
      { status: 405 }
    );
  }

  return handler(request, context);
}
