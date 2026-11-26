"use client";

import React from "react";
import { AppProvider, type Language } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import FloatingWhatsAppButton from "@/components/common/FloatingWhatsAppButton";
import GuestIdentityGateModal from "@/components/modals/GuestIdentityGateModal";

export default function ClientProviders({
  children,
  initialLang = "ar",
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
        <GuestIdentityGateModal />
        <FloatingWhatsAppButton />
      </AppProvider>
    </AuthProvider>
  );
}
