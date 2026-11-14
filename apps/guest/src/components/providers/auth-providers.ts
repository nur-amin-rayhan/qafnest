"use client";

/**
 * Unified Auth Providers for QafNest Guest App
 * Re-exports AuthProvider, ClientProviders, and authentication context hooks
 * to guarantee complete module resolution for Next.js bundler.
 */

import ClientProviders from "./ClientProviders";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider, useApp } from "@/context/AppContext";

export { ClientProviders, AuthProvider, useAuth, AppProvider, useApp };
export default ClientProviders;
