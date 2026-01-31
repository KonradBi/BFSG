import Link from "next/link";

export default function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3">
      {/*
        NOTE: The provided logo asset contains a typo (BSFG vs BFSG).
        Until we get the corrected asset, we crop the image to show only the shield mark.
      */}
      <span className="h-10 w-10 rounded-lg overflow-hidden bg-white border border-slate-200">
        <img src="/brand/logo.png" alt="BFSG WebCheck" className="h-full w-full object-cover object-top" />
      </span>
      <span className="font-bold tracking-tight text-lg text-slate-900">BFSG‑WebCheck</span>
    </Link>
  );
}
