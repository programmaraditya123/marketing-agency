export default function HeroHeading() {
  return (
    <div className="text-center max-w-4xl mx-auto px-4">
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wider text-cyan-300 uppercase shadow-xs mb-1.5 sm:mb-2">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Orbit by VidoraHub · AI Marketing Agency</span>
      </div>

      <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.08] sm:leading-[1.06] drop-shadow-lg">
        The Marketing AI that <br className="hidden sm:inline" />
        <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300">
          moves the
        </span>{" "}
        Needle.
      </h1>
    </div>
  );
}
