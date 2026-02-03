"use client";

import { signIn, signOut, useSession } from "next-auth/react";

type Props = {
  className?: string;
  /** Where to return after sign-in/sign-out. Defaults to current URL. */
  callbackUrl?: string;
};

export default function AuthNav({ className, callbackUrl }: Props) {
  const { data: session, status } = useSession();

  // Default: after sign-in/sign-out go back to landing page (avoid returning to /scan or dashboard after logout).
  const cb = callbackUrl || "/";

  if (status === "loading") {
    return <div className={className} />;
  }

  if (session?.user) {
    return (
      <div className={"flex items-center gap-2 md:gap-3 " + (className || "")}>
        {/* Email/name hidden to reduce clutter */}
        {/* Mobile: icon-only logout */}
        <button
          onClick={() => signOut({ callbackUrl: cb })}
          aria-label="Ausloggen"
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 bg-white/70 text-slate-700 hover:text-blue-600 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
        {/* Desktop: text logout */}
        <button
          onClick={() => signOut({ callbackUrl: cb })}
          className="hidden md:inline text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
        >
          Ausloggen
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: icon-only login */}
      <button
        onClick={() => signIn("google", { callbackUrl: cb })}
        aria-label="Einloggen"
        className={"md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 bg-white/70 text-slate-700 hover:text-blue-600 transition-colors " + (className || "")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
      {/* Desktop: text login */}
      <button
        onClick={() => signIn("google", { callbackUrl: cb })}
        className={"hidden md:inline text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors " + (className || "")}
      >
        Einloggen
      </button>
    </>
  );
}
