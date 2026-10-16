"use client";

// components/HudBackground.tsx
// Full-screen HUD backdrop for the whole app: grid, radial glow, falling
// readouts ("rain"), idea-spark dust and a slow scanline. Same visual language
// as ProjectGeneratingModal. Fixed behind everything, never takes clicks.
// Mount once in app/layout.tsx.

import { motion, useReducedMotion } from "framer-motion";

const CYAN = "#22d3ee";
const CYAN_LIGHT = "#67e8f9";

const GRID_BG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M48 0H0V48" fill="none" stroke="${CYAN}" stroke-opacity="0.25" stroke-width="1"/></svg>`,
)}`;

const READOUTS = [
  ["ages 8-10", "intro", "4 facts", "summary", "2 pics"],
  ["ages 5-7", "image", "3 pics", "fact", "6 wds"],
  ["ages 11-13", "source", "5 links", "intro", "4 facts"],
  ["bibliography", "fact", "6 wds", "image", "3 pics"],
  ["summary", "intro", "2 pics", "source", "5 links"],
];

const COLUMN_COUNT = 14;
const COLUMNS = Array.from({ length: COLUMN_COUNT }).map((_, i) => ({
  left: `${(i / (COLUMN_COUNT - 1)) * 100}%`,
  tokens: READOUTS[i % READOUTS.length],
  duration: 16 + (i % 5) * 3.5,
  delay: (i % 6) * 0.9,
  red: i % 3 === 2,
  hideOnMobile: i % 2 === 1,
}));

const SPARKS = [
  { top: "10%", left: "8%", delay: 0 },
  { top: "18%", left: "62%", delay: 0.8 },
  { top: "26%", left: "90%", delay: 1.6 },
  { top: "44%", left: "30%", delay: 0.4 },
  { top: "52%", left: "94%", delay: 1.9 },
  { top: "64%", left: "6%", delay: 1.1 },
  { top: "72%", left: "56%", delay: 2.3 },
  { top: "84%", left: "84%", delay: 0.6 },
  { top: "90%", left: "22%", delay: 1.4 },
];

const MASK =
  "linear-gradient(to bottom, transparent, black 20%, black 70%, transparent)";

export function HudBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#04070a]"
    >
      {/* grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("${GRID_BG}")`,
          backgroundSize: "48px 48px",
        }}
      />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a1219_0%,_#04070a_80%)] opacity-90" />

      {/* falling readouts */}
      <div className="absolute inset-0 opacity-60">
        {COLUMNS.map((col, i) => (
          <motion.div
            key={i}
            className={`absolute top-0 flex-col gap-5 font-mono text-[10px] ${
              col.hideOnMobile ? "hidden sm:flex" : "flex"
            }`}
            style={{
              left: col.left,
              color: col.red ? "rgba(220,38,38,0.25)" : `${CYAN}59`,
              maskImage: MASK,
              WebkitMaskImage: MASK,
            }}
            initial={{ y: "-40vh" }}
            animate={
              reduceMotion
                ? { y: `${10 + i * 6}vh` }
                : { y: ["-40vh", "110vh"] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: col.duration,
                    repeat: Infinity,
                    delay: col.delay,
                    ease: "linear",
                  }
            }
          >
            {col.tokens.map((t, j) => (
              <span key={j}>{t}</span>
            ))}
          </motion.div>
        ))}
      </div>

      {/* idea-spark dust */}
      {SPARKS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{ top: s.top, left: s.left, backgroundColor: CYAN_LIGHT }}
          initial={{ opacity: 0.1 }}
          animate={reduceMotion ? undefined : { opacity: [0.1, 0.7, 0.1] }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* scanline */}
      {!reduceMotion && (
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${CYAN_LIGHT}80, transparent)`,
          }}
          initial={{ top: "0%" }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}
