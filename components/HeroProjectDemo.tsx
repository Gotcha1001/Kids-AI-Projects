"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

// The one animated moment on the page: a sample project sheet fills itself in.
const sheet: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.5, delayChildren: 0.35 } },
};
const block: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
const writing: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

function Lines({ widths }: { widths: number[] }) {
  return (
    <div className="space-y-1.5">
      {widths.map((w, i) => (
        <motion.div
          key={i}
          variants={writing}
          style={{ width: `${w}%`, originX: 0 }}
          className="h-2 rounded-full bg-[#14213D]/20 dark:bg-[#E8EEFF]/25"
        />
      ))}
    </div>
  );
}

const label =
  "mb-1.5 text-sm font-extrabold font-[family-name:var(--font-display)] text-[#14213D] dark:text-[#E8EEFF]";

export function HeroProjectDemo() {
  const reduce = useReducedMotion();

  return (
    <motion.article
      aria-label="Example of a finished project"
      variants={sheet}
      initial={reduce ? "show" : "hidden"}
      animate="show"
      className="relative mx-auto w-full max-w-md rotate-[1.5deg] overflow-hidden rounded-2xl border-2 border-[#14213D] bg-white shadow-[8px_8px_0_#14213D] dark:border-[#E8EEFF] dark:bg-[#17203A] dark:shadow-[8px_8px_0_#2B3A63]"
    >
      <motion.header
        variants={block}
        className="bg-[#0E7FC1] px-5 py-4 text-white"
      >
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold leading-tight">
          Amazing Aquatic Animals
        </h2>
        <p className="text-sm text-white/85">By Thando, ages 8–10</p>
      </motion.header>

      <div className="space-y-4 p-5">
        <motion.section variants={block}>
          <h3 className={label}>Introduction</h3>
          <Lines widths={[100, 94, 62]} />
        </motion.section>

        <motion.figure variants={block}>
          <svg
            viewBox="0 0 240 110"
            role="img"
            aria-label="Illustration of a whale swimming in the sea"
            className="w-full rounded-lg border border-[#14213D]/20"
          >
            <rect width="240" height="110" fill="#BFE6FA" />
            <path
              d="M0 78 Q30 66 60 78 T120 78 T180 78 T240 78 V110 H0Z"
              fill="#5CB8E6"
            />
            <path
              d="M70 62 C70 40 120 34 156 50 C176 58 184 66 196 56 L208 44 L206 70 C198 80 186 78 176 72 C140 88 80 84 70 62Z"
              fill="#3B5B8C"
            />
            <circle cx="98" cy="56" r="3" fill="#fff" />
            <path
              d="M0 92 Q30 82 60 92 T120 92 T180 92 T240 92 V110 H0Z"
              fill="#2E8FC9"
            />
          </svg>
          <figcaption className="mt-1 text-xs italic text-[#41507A] dark:text-[#A9B6D8]">
            A blue whale (oceanfacts.example)
          </figcaption>
        </motion.figure>

        <motion.section
          variants={block}
          className="rounded-xl border-2 border-dashed border-[#14A38B] bg-[#14A38B]/10 p-3 text-sm text-[#14213D] dark:text-[#E8EEFF]"
        >
          <strong>Did you know?</strong> Blue whales are the biggest animals
          that have ever lived.
        </motion.section>

        <motion.section variants={block}>
          <h3 className={label}>Bibliography</h3>
          <ol className="list-decimal space-y-0.5 pl-5 text-xs text-[#41507A] dark:text-[#A9B6D8]">
            <li>Ocean facts for kids. oceanfacts.example/blue-whale</li>
            <li>Sea animals A to Z. seaanimals.example/whales</li>
          </ol>
        </motion.section>
      </div>
    </motion.article>
  );
}
