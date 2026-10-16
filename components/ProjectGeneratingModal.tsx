"use client";

// components/ProjectGeneratingModal.tsx
// Same look as the English Topic Generator's LessonGeneratingModal
// (dark HUD card, cyan glow, falling readouts, scanline, spinning core),
// but self-contained: no ColorThemeContext, no --font-hud needed.
// Steps are driven by the REAL project status (queued -> researching -> writing).

import type { ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BookOpen, Search, PenLine, Sparkles, Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  TEMPLATES,
  type ProjectStatus,
  type TemplateId,
} from "@/convex/constants";

// cyan HUD palette (Tailwind cyan scale)
const hex400 = "#22d3ee";
const shades = {
  300: "#67e8f9",
  400: "#22d3ee",
  500: "#06b6d4",
  600: "#0891b2",
  700: "#0e7490",
};

const GRID_BG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M48 0H0V48" fill="none" stroke="${hex400}" stroke-opacity="0.25" stroke-width="1"/></svg>`,
)}`;

const STEPS = [
  { icon: Sparkles, label: "Getting started", status: "queued" },
  { icon: Search, label: "Finding facts and pictures", status: "researching" },
  { icon: PenLine, label: "Writing your project", status: "writing" },
] as const;

function activeIndex(status: ProjectStatus): number {
  if (status === "queued") return 0;
  if (status === "researching") return 1;
  if (status === "writing") return 2;
  return STEPS.length; // done
}

const PULSES = [
  { top: "12%", left: "10%", delay: 0 },
  { top: "22%", left: "86%", delay: 0.8 },
  { top: "70%", left: "8%", delay: 1.5 },
  { top: "80%", left: "88%", delay: 0.5 },
  { top: "48%", left: "92%", delay: 1.9 },
  { top: "58%", left: "6%", delay: 1.1 },
];

// falling "readouts" - kid-project flavoured
const READOUTS = [
  ["ages 8-10", "intro", "4 facts"],
  ["ages 5-7", "image", "3 pics"],
  ["ages 11-13", "source", "5 links"],
  ["summary", "intro", "2 pics"],
  ["bibliography", "fact", "6 wds"],
];

const RAIN_COLUMNS = Array.from({ length: 6 }).map((_, i) => ({
  left: `${(i / 5) * 100}%`,
  tokens: READOUTS[i % READOUTS.length],
  duration: 8 + (i % 4) * 1.8,
  delay: (i % 5) * 0.6,
}));

const flicker = {
  opacity: [0.55, 0.9, 0.5, 1, 0.6, 0.85, 0.55],
  scale: [0.95, 1.05, 0.92, 1.1, 0.97, 1.04, 0.95],
};

export function ProjectGeneratingModal({
  open,
  status,
  statusMessage,
  topic,
  template = "classic",
  sectionCount,
  footer,
}: {
  open: boolean;
  status: ProjectStatus;
  statusMessage?: string | null;
  topic: string;
  template?: TemplateId;
  sectionCount?: number;
  footer?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const meta = TEMPLATES[template];
  const current = activeIndex(status);

  const spin = (reverse = false) =>
    reduceMotion ? undefined : { rotate: reverse ? -360 : 360 };
  const spinTransition = (duration: number) =>
    reduceMotion
      ? { duration: 0 }
      : { duration, repeat: Infinity, ease: "linear" as const };

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-full border-0 bg-transparent p-0 shadow-none"
        style={{ maxWidth: "min(28rem, calc(100vw - 2rem))" }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">
          Making your project about {topic}
        </DialogTitle>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative mx-auto w-full max-w-md min-w-0 overflow-hidden rounded-xl border bg-[#04070a] p-8 text-center"
            style={{
              borderColor: `${hex400}40`,
              boxShadow: `0 0 60px -12px ${hex400}80`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage: `url("${GRID_BG}")`,
                backgroundSize: "48px 48px",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a1219_0%,_#04070a_75%)]" />

            {/* falling readouts */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
              {RAIN_COLUMNS.map((col, i) => (
                <motion.div
                  key={i}
                  className="absolute top-0 flex flex-col gap-5 font-mono text-[10px]"
                  style={{
                    left: col.left,
                    color: i % 2 === 0 ? `${hex400}59` : "rgba(220,38,38,0.25)",
                    maskImage:
                      "linear-gradient(to bottom, transparent, black 25%, black 65%, transparent)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent, black 25%, black 65%, transparent)",
                  }}
                  animate={reduceMotion ? undefined : { y: ["-30%", "130%"] }}
                  transition={{
                    duration: col.duration,
                    repeat: Infinity,
                    delay: col.delay,
                    ease: "linear",
                  }}
                >
                  {col.tokens.map((t, j) => (
                    <span key={j}>{t}</span>
                  ))}
                </motion.div>
              ))}
            </div>

            {/* idea-spark dust */}
            {PULSES.map((s, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
                style={{
                  top: s.top,
                  left: s.left,
                  backgroundColor: shades[300],
                }}
                animate={
                  reduceMotion ? undefined : { opacity: [0.1, 0.7, 0.1] }
                }
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: s.delay,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* corner brackets */}
            {[
              "-left-px -top-px border-l-2 border-t-2",
              "-right-px -top-px border-r-2 border-t-2",
              "-left-px -bottom-px border-l-2 border-b-2",
              "-right-px -bottom-px border-r-2 border-b-2",
            ].map((cls, i) => (
              <div
                key={i}
                className={`pointer-events-none absolute ${cls} h-5 w-5`}
                style={{ borderColor: `${hex400}99` }}
              />
            ))}

            {/* scanline */}
            <motion.div
              className="pointer-events-none absolute left-0 right-0 h-px"
              style={{
                background: `linear-gradient(to right, transparent, ${shades[300]}80, transparent)`,
              }}
              animate={reduceMotion ? undefined : { top: ["0%", "100%"] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
            />

            {/* flickering core */}
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full border border-dashed"
                style={{ borderColor: `${hex400}59` }}
                animate={spin()}
                transition={spinTransition(14)}
              />
              <motion.div
                className="absolute inset-1.5 rounded-full border"
                style={{ borderColor: `${shades[600]}66` }}
                animate={spin(true)}
                transition={spinTransition(9)}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: `${shades[300]}4d` }}
                animate={
                  reduceMotion
                    ? undefined
                    : { scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }
                }
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <motion.div
                className="absolute h-10 w-10 rounded-full blur-xl"
                style={{ backgroundColor: shades[300] }}
                animate={reduceMotion ? undefined : flicker}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div
                className="relative flex h-12 w-12 items-center justify-center rounded-full border"
                style={{
                  borderColor: `${hex400}80`,
                  background: `linear-gradient(to bottom right, ${shades[700]}, ${shades[500]})`,
                  boxShadow: `0 0 25px -4px ${hex400}e6`,
                }}
              >
                <BookOpen className="h-5 w-5 text-[#04070a]" />
              </div>
            </div>

            <h2 className="relative font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-stone-50">
              Making your project
            </h2>
            <p className="relative mt-1 font-[family-name:var(--font-display)] text-base text-stone-200 [overflow-wrap:anywhere]">
              &ldquo;{topic}&rdquo;
            </p>
            <p className="relative mt-2 font-mono text-xs uppercase tracking-[0.2em] text-stone-400">
              Building your {meta.name}
            </p>

            {/* live status from Convex */}
            <p
              role="status"
              aria-live="polite"
              className="relative mt-3 min-h-[1.25rem] font-mono text-xs [overflow-wrap:anywhere]"
              style={{ color: shades[300] }}
            >
              {statusMessage ?? "Working on it…"}
            </p>

            <ol className="relative mt-6 space-y-2.5">
              {STEPS.map((step, i) => (
                <StepRow
                  key={step.status}
                  step={step}
                  index={i}
                  done={i < current}
                  active={i === current}
                  sectionCount={sectionCount}
                />
              ))}
            </ol>

            <div
              className="relative mt-8 h-1 overflow-hidden rounded-full"
              style={{ backgroundColor: `${hex400}1a` }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: "35%",
                  background: `linear-gradient(to right, ${shades[700]}, ${shades[300]}, ${shades[700]})`,
                }}
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            <p className="relative mt-4 font-mono text-[11px] text-stone-500">
              Usually under a minute. Keep this page open.
            </p>

            {footer ? (
              <div className="relative mt-4 text-stone-200">{footer}</div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function StepRow({
  step,
  index,
  done,
  active,
  sectionCount,
}: {
  step: (typeof STEPS)[number];
  index: number;
  done: boolean;
  active: boolean;
  sectionCount?: number;
}) {
  const Icon = step.icon;
  return (
    <motion.li
      aria-current={active ? "step" : undefined}
      className="group flex items-center gap-3 rounded-md border px-3 py-2 text-left"
      style={{
        borderColor: active ? `${hex400}59` : `${hex400}1a`,
        backgroundColor: active ? `${hex400}14` : `${hex400}0a`,
        opacity: !active && !done ? 0.55 : 1,
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: !active && !done ? 0.55 : 1, x: 0 }}
      transition={{ delay: 0.12 * index + 0.2, duration: 0.4 }}
    >
      <motion.div
        className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-[#0a1219]"
        style={{ borderColor: `${hex400}4d` }}
        animate={
          active
            ? {
                borderColor: [`${hex400}4d`, `${shades[300]}b3`, `${hex400}4d`],
              }
            : undefined
        }
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {done ? (
          <Check
            className="h-3.5 w-3.5"
            style={{ color: shades[300] }}
            strokeWidth={3}
          />
        ) : (
          <Icon className="h-3 w-3" style={{ color: `${shades[300]}cc` }} />
        )}
      </motion.div>
      <span className="min-w-0 font-mono text-[13px] text-stone-200/80">
        {step.label}
        {active && (
          <motion.span
            className="inline-block"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            …
          </motion.span>
        )}
        {step.status === "writing" && sectionCount ? (
          <span className="block text-[11px] text-stone-400">
            {sectionCount} sections, a summary and sources
          </span>
        ) : null}
      </span>
      {active ? (
        <motion.span
          className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: hex400 }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      ) : (
        <span
          className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: done ? hex400 : `${hex400}33` }}
        />
      )}
    </motion.li>
  );
}
