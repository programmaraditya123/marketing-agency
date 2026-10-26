import Image from "next/image";
export default function ResearchPreview() {
  return <div className="relative mx-auto w-full max-w-md">
    <div aria-hidden="true" className="absolute inset-10 rounded-full bg-violet-600/15 blur-3xl" />
    <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[#03030e]">
      <Image src="/brand/orbit-logo.webp" alt="Orbit by VidoraHub — brand research and marketing insights" width={640} height={640} sizes="(max-width: 1024px) 85vw, 400px" preload className="h-auto w-full" />
      <div className="border-t border-white/10 px-6 py-5"><p className="text-xs font-medium tracking-[.16em] text-cyan-300">YOUR BRAND. A CLEARER DIRECTION.</p><p className="mt-2 text-sm leading-6 text-slate-400">Website evidence. Audience insights. Your next move.</p></div>
    </div>
  </div>;
}
