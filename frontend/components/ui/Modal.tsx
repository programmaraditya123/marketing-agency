"use client";
import { useEffect, useId, useRef, type ReactNode, type MouseEvent } from "react";
export default function Modal({ open, title, eyebrow, children, onClose }: {
  open: boolean; title: string; eyebrow?: string; children: ReactNode; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);
  function backdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }
  return <dialog ref={ref} aria-labelledby={headingId} onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={backdrop} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); onClose(); } }}
    className="fixed inset-0 m-auto max-h-[88svh] w-[92vw] max-w-3xl overflow-hidden rounded-3xl border border-violet-100 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm">
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-violet-50/60 px-6 py-5 sm:px-8 sm:py-6">
      <div className="min-w-0">{eyebrow && <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-violet-600">{eyebrow}</p>}<h2 id={headingId} className="break-words text-xl font-semibold leading-snug tracking-tight text-violet-950 sm:text-2xl">{title}</h2></div>
      <button type="button" onClick={onClose} aria-label="Close details" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white text-xl text-violet-800 transition hover:bg-violet-100 focus-visible:outline-violet-600">×</button>
    </div>
    <div className="max-h-[63svh] overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-8">{children}</div>
  </dialog>;
}
