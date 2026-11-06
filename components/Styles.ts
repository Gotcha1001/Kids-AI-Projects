// components/Styles.ts
// Shared class strings. Everything here uses the same cyan HUD palette as
// ProjectGeneratingModal: near-black #04070a, panel #0a1219, cyan-400 accents,
// stone text, mono labels. Use these instead of one-off colours in pages.

/** Primary glowing cyan button (unchanged). */
export const stickerButton =
  "inline-flex items-center justify-center rounded-xl border border-cyan-300/60 bg-cyan-400 px-6 py-3 text-base font-bold text-[#04070a] shadow-[0_0_24px_-4px_rgba(34,211,238,0.8)] transition hover:bg-cyan-300 hover:shadow-[0_0_32px_-2px_rgba(34,211,238,0.9)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/40 disabled:opacity-60";

/** Small secondary button (toolbars, card actions). */
export const hudSmallButton =
  "rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 disabled:opacity-60";

/** Small destructive button, same shape as hudSmallButton. */
export const hudDangerButton =
  "rounded-lg border border-red-400/30 bg-red-400/5 px-3 py-1.5 font-mono text-xs font-semibold text-red-300 transition hover:border-red-300/60 hover:bg-red-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40 disabled:opacity-60";

/** Form label: mono, like the modal's status lines. */
export const hudLabel =
  "mb-1.5 block font-mono text-xs uppercase tracking-[0.18em] text-cyan-200/80";

/** Text input / select. */
export const hudInput =
  "w-full rounded-lg border border-cyan-400/25 bg-[#0a1219]/70 px-3 py-2 text-stone-50 placeholder:text-stone-500 transition focus:border-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40";

/** Selectable card (reading level, template). Combine with the On/Off strings. */
export const hudChoice =
  "rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50";
export const hudChoiceOn =
  "border-cyan-300 bg-cyan-400/10 shadow-[0_0_24px_-8px_rgba(34,211,238,0.8)]";
export const hudChoiceOff =
  "border-cyan-400/20 bg-[#0a1219]/60 hover:border-cyan-400/50 hover:bg-cyan-400/5";

/** Small status / tag pill. */
export const hudChip =
  "inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-200";
