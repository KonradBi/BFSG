"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ConsentValue = "accepted" | "essential";

const COOKIE_NAME = "cookie_consent";
const STORAGE_KEY = "als_cookie_consent";
const MAX_AGE_DAYS = 180;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  // For https sites, some browsers require Secure for persistence.
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

function getStoredConsent(): string | null {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

function setStoredConsent(value: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

function getConsent(): ConsentValue | null {
  const v = getCookie(COOKIE_NAME) || getStoredConsent();
  if (v === "accepted" || v === "essential") return v;
  return null;
}

export function resetCookieConsent() {
  if (typeof document === "undefined") return;
  // delete cookie + storage
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cookie_consent_reset"));
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    const existing = getConsent();
    return !existing;
  });
  const handledRef = useRef(false);

  useEffect(() => {
    const onReset = () => setVisible(true);
    window.addEventListener("cookie_consent_reset", onReset as EventListener);
    return () => window.removeEventListener("cookie_consent_reset", onReset as EventListener);
  }, []);

  useEffect(() => {
    if (visible) handledRef.current = false;
  }, [visible]);

  function setConsent(v: ConsentValue) {
    // persist in both cookie + localStorage (some in-app browsers block cookies)
    setStoredConsent(v);
    setCookie(COOKIE_NAME, v, MAX_AGE_DAYS);
    setVisible(false);
  }

  function handleConsent(v: ConsentValue, event?: React.SyntheticEvent) {
    // Support in-app browsers that sometimes drop or delay click events on fixed elements.
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (handledRef.current) return;
    handledRef.current = true;
    setConsent(v);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[99999] p-3 md:p-4 pointer-events-none">
      <div
        className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/95 backdrop-blur shadow-2xl pointer-events-auto isolate"
        onClick={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-5">
          <div className="text-sm font-black text-slate-900">Cookies & Datenschutz</div>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            Wir verwenden Cookies, die für Login und Sicherheit notwendig sind. Zusätzliche Analyse/Marketing‑Cookies setzen wir nur mit Ihrer Zustimmung.
            Details finden Sie in unserer <Link href="/datenschutz" className="font-bold text-blue-700 hover:text-blue-800">Datenschutzerklärung</Link>.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <button
              type="button"
              onClick={(e) => handleConsent("essential", e)}
              onPointerDown={(e) => handleConsent("essential", e)}
              onPointerUp={(e) => handleConsent("essential", e)}
              onTouchEnd={(e) => handleConsent("essential", e)}
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold cursor-pointer touch-manipulation"
            >
              Nur notwendige
            </button>
            <button
              type="button"
              onClick={(e) => handleConsent("accepted", e)}
              onPointerDown={(e) => handleConsent("accepted", e)}
              onPointerUp={(e) => handleConsent("accepted", e)}
              onTouchEnd={(e) => handleConsent("accepted", e)}
              className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer touch-manipulation"
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
