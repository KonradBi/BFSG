"use client";

import Link from "next/link";
import AuthNav from "./AuthNav";
import BrandMark from "./BrandMark";

type Props = {
  /** Defaults to home */
  backHref?: string;
  /** Defaults to "Zurück" */
  backLabel?: string;
  className?: string;
};

export default function SiteNav({ backHref = "/", backLabel = "Zurück", className }: Props) {
  return (
    <nav className={"fixed top-0 w-full z-50 border-b border-slate-200/60 glass " + (className || "")}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <BrandMark />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <AuthNav />

          {/* Mobile: back icon */}
          <Link
            href={backHref}
            aria-label={backLabel}
            className="inline-flex md:hidden items-center justify-center h-10 w-10 rounded-full border border-slate-200 bg-white/70 text-slate-700 hover:text-blue-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>

          {/* Desktop */}
          <Link href={backHref} className="hidden md:flex text-sm font-medium text-slate-600 hover:text-blue-600 transition items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {backLabel}
          </Link>
        </div>
      </div>
    </nav>
  );
}
