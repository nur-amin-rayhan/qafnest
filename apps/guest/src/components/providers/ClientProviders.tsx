"use client";

import React from "react";
import { AppProvider, type Language } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";

export default function ClientProviders({
  children,
  initialLang = "en",
  initialTheme = "dark",
}: {
  children: React.ReactNode;
  initialLang?: Language;
  initialTheme?: "light" | "dark";
}) {
  return (
    <AuthProvider>
      <AppProvider initialLang={initialLang} initialTheme={initialTheme}>
        {children}
      </AppProvider>
    </AuthProvider>
  );
}
