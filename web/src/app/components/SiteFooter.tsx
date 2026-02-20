"use client";

import Link from "next/link";
import { resetCookieConsent } from "./CookieBanner";

type Props = {
  note?: string;
  className?: string;
};

export default function SiteFooter({
  note = "Hinweis: Diese Seite speichert Scan-IDs lokal im Browser (localStorage).",
  className,
}: Props) {
  return (
    <footer className={"mt-16 pt-10 border-t border-slate-200 text-xs text-slate-500 " + (className || "")}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>{note}</div>
        <div className="flex items-center gap-4 font-bold flex-wrap">
          <button
            type="button"
            onClick={() => resetCookieConsent()}
            className="hover:text-navy-900"
          >
            Cookie‑Einstellungen
          </button>
          <Link href="/agb" className="hover:text-navy-900">AGB</Link>
          <Link href="/impressum" className="hover:text-navy-900">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-navy-900">Datenschutz</Link>
        </div>
      </div>
    </footer>
  );
}
