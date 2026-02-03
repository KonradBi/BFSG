import Link from "next/link";

export default function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 md:gap-3 shrink-0">
      <span className="h-12 w-12 md:h-14 md:w-14 rounded-2xl overflow-hidden bg-white border border-slate-200">
        <img src="/brand/logo-mark.jpg" alt="BFSG WebCheck" className="h-full w-full object-contain" />
      </span>
      <span className="hidden sm:inline font-bold tracking-tight text-lg text-slate-900">BFSG‑WebCheck</span>
    </Link>
  );
}
