"use client";

import { signIn, signOut, useSession } from "next-auth/react";

type Props = {
  className?: string;
  /** Where to return after sign-in/sign-out. Defaults to current URL. */
  callbackUrl?: string;
};

export default function AuthNav({ className, callbackUrl }: Props) {
  const { data: session, status } = useSession();

  const cb = callbackUrl || (typeof window !== "undefined" ? window.location.href : "/");

  if (status === "loading") {
    return <div className={className} />;
  }

  if (session?.user) {
    const label = session.user.email || session.user.name || "Account";
    return (
      <div className={"flex items-center gap-3 " + (className || "")}>
        <div className="hidden md:block text-xs font-bold text-slate-600 max-w-[220px] truncate">{label}</div>
        <button
          onClick={() => signOut({ callbackUrl: cb })}
          className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
        >
          Ausloggen
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google", { callbackUrl: cb })}
      className={"text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors " + (className || "")}
    >
      Einloggen
    </button>
  );
}
