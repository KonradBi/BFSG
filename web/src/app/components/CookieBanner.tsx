"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConsentValue = "accepted" | "essential";

const COOKIE_NAME = "cookie_consent";
const MAX_AGE_DAYS = 180;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function resetCookieConsent() {
  if (typeof document === "undefined") return;
  // delete cookie
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cookie_consent_reset"));
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    const existing = getCookie(COOKIE_NAME);
    return !existing;
  });

  useEffect(() => {
    const onReset = () => setVisible(true);
    window.addEventListener("cookie_consent_reset", onReset as EventListener);
    return () => window.removeEventListener("cookie_consent_reset", onReset as EventListener);
  }, []);

  function setConsent(v: ConsentValue) {
    setCookie(COOKIE_NAME, v, MAX_AGE_DAYS);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 md:p-4">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/95 backdrop-blur shadow-2xl">
        <div className="p-4 md:p-5">
          <div className="text-sm font-black text-slate-900">Cookies & Datenschutz</div>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            Wir verwenden Cookies, die für Login und Sicherheit notwendig sind. Zusätzliche Analyse/Marketing‑Cookies setzen wir nur mit Ihrer Zustimmung.
            Details finden Sie in unserer <Link href="/datenschutz" className="font-bold text-blue-700 hover:text-blue-800">Datenschutzerklärung</Link>.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => setConsent("essential")}
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold"
            >
              Nur notwendige
            </button>
            <button
              type="button"
              onClick={() => setConsent("accepted")}
              className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black"
            >
              Akzeptieren
            </button>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">
            Hinweis: Derzeit werden keine Tracking‑Cookies ohne Zustimmung gesetzt.
          </div>
        </div>
      </div>
    </div>
  );
}
