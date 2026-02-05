import Link from "next/link";

export default function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 md:gap-3 shrink-0">
      {/* Logo without container chrome (no border/white tile) */}
      <img
        src="/brand/logo-mark.png"
        alt="BFSG WebCheck"
        className="h-10 w-10 md:h-12 md:w-12 object-contain"
      />
      <span className="hidden sm:inline font-bold tracking-tight text-lg text-slate-900">BFSG‑WebCheck</span>
    </Link>
  );
}
