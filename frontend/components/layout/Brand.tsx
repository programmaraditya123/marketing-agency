import Image from "next/image";
import Link from "next/link";
export default function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" aria-label="Orbit by VidoraHub home" className={`flex shrink-0 items-center ${compact ? "gap-2" : "gap-3"}`}>
    <Image src="/brand/orbit-logo.webp" alt="" width={compact ? 40 : 56} height={compact ? 40 : 56} className="rounded-xl" />
    <span className="flex flex-col"><span className={`${compact ? "text-xl" : "text-2xl"} font-semibold tracking-tight text-white`}>Orbit<span className="text-cyan-300">.</span></span><span className={`${compact ? "text-[8px]" : "text-[10px]"} tracking-[.16em] text-slate-400`}>BY VIDORAHUB</span></span>
  </Link>;
}
