"use client";

import { SessionProvider } from "next-auth/react";
import CookieBanner from "./components/CookieBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CookieBanner />
    </SessionProvider>
  );
}
