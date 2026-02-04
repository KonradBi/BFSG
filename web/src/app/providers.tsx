"use client";

import { SessionProvider } from "next-auth/react";
import CookieBanner from "./components/CookieBanner";
import GoogleAnalytics from "./components/GoogleAnalytics";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CookieBanner />
      <GoogleAnalytics />
    </SessionProvider>
  );
}
