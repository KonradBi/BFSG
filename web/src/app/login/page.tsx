"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 pt-24 pb-20 px-6">
      <div className="max-w-xl mx-auto glass rounded-[2rem] p-10 border border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-slate-900">Login</h1>
          <Link href="/" className="text-sm font-bold text-slate-600 hover:text-blue-600">
            Zurück
          </Link>
        </div>

        {status === "loading" ? (
          <div className="text-sm text-slate-600">Lade Session…</div>
        ) : user ? (
          <>
            <div className="text-sm text-slate-700 mb-6">
              Eingeloggt als <span className="font-bold">{user.email || user.name}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-2xl font-black transition-all"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-6">Melde dich mit Google an.</p>
            <button
              onClick={() => signIn("google", { callbackUrl: "/scan" })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black transition-all"
            >
              Mit Google einloggen
            </button>
          </>
        )}

        <div className="mt-6 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
          Hinweis: Keine Rechtsberatung.
        </div>
      </div>
    </main>
  );
}
