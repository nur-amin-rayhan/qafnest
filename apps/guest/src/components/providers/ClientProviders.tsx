"use client";

import React from "react";
import { AppProvider, type Language } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";

export default function ClientProviders({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Language;
}) {
  return (
    <AuthProvider>
      <AppProvider initialLang={initialLang}>{children}</AppProvider>
    </AuthProvider>
  );
}
