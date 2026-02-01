import Link from "next/link";

export default function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 md:gap-3 shrink-0">
      {/*
        NOTE: The provided logo asset contains a typo (BSFG vs BFSG).
        Until we get the corrected asset, we crop the image to show only the shield mark.
      */}
      <span className="h-9 w-9 md:h-10 md:w-10 rounded-lg overflow-hidden bg-white border border-slate-200">
        <img src="/brand/logo.png" alt="BFSG WebCheck" className="h-full w-full object-cover object-top" />
      </span>
      <span className="hidden sm:inline font-bold tracking-tight text-lg text-slate-900">BFSG‑WebCheck</span>
    </Link>
  );
}
