// app/page.tsx - ProjectKids landing page.
// Server component: all interactivity lives in the imported client components
// (HeroTopicForm, HomeCta, ReadingLevelDemo, HeroProjectDemo, ThemeToggle).
// Lives OUTSIDE the (app) route group so it has no sidebar. Keep "/" public in proxy.ts.
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { TEMPLATE_LIST, type TemplateId } from "@/convex/constants";
import { BrandMark } from "@/components/BrandMark";

import { HeroTopicForm } from "@/components/HeroTopicForm";
import { HeroProjectDemo } from "@/components/HeroProjectDemo";
import { ReadingLevelDemo } from "@/components/ReadingLevelDemo";
import { HomeCta } from "@/components/HomeCta";
import { ThemeToggle } from "./components/ThemeToggle";

interface Step {
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    title: "Type a topic",
    text: "Something from class, like “History of South Africa” or “Aquatic animals”. Choose a reading level and a template.",
  },
  {
    title: "We look it up and write it",
    text: "ProjectKids finds web pages and pictures, then writes your project from what those pages say. It usually takes under a minute.",
  },
  {
    title: "Download or share",
    text: "Get a PDF to print or hand in. Change the template whenever you like. Your project stays private until you choose to share the link.",
  },
];

const INSIDE: string[] = [
  "An introduction",
  "Sections with pictures",
  "“Did you know?” facts",
  "A word list that explains the tricky words",
  "A summary at the end",
  "A bibliography of the pages we used",
];

interface GrownUpNote {
  title: string;
  text: string;
}

const GROWN_UP_NOTES: GrownUpNote[] = [
  {
    title: "Facts you can check",
    text: "Every project ends with a bibliography of real web pages. The writing is based on those pages, so you can read them together.",
  },
  {
    title: "Written for the reader's age",
    text: "Three reading levels change the words, the sentence length and how much detail is included. Hard history is told calmly, without graphic detail.",
  },
  {
    title: "Private by default",
    text: "Nothing is public until the owner switches a project to public and shares the link.",
  },
];

const SECTION_TITLE =
  "font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight text-[#14213D] dark:text-[#E8EEFF] sm:text-4xl";
const BODY_TEXT = "text-[#41507A] dark:text-[#A9B6D8]";

/** A tiny drawing of each template's page layout, built from plain boxes. */
function TemplateSketch({
  id,
  accent,
  soft,
}: {
  id: TemplateId;
  accent: string;
  soft: string;
}) {
  const line = "h-1.5 rounded-full bg-[#14213D]/20 dark:bg-[#E8EEFF]/25";
  const frame =
    "h-32 overflow-hidden rounded-lg border-2 border-[#14213D]/30 bg-white dark:border-[#E8EEFF]/30 dark:bg-[#0B1220]";

  switch (id) {
    case "classic":
      return (
        <div aria-hidden className={frame}>
          <div className="h-8" style={{ backgroundColor: accent }} />
          <div className="space-y-1.5 p-3">
            <div className={`${line} w-full`} />
            <div className={`${line} w-5/6`} />
            <div className={`${line} w-2/3`} />
            <div className="pt-1" />
            <div className={`${line} w-full`} />
            <div className={`${line} w-3/4`} />
          </div>
        </div>
      );
    case "factfile":
      return (
        <div aria-hidden className={frame}>
          <div className="space-y-1.5 p-3">
            <div
              className="h-2 w-1/2 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <div className={`${line} w-full`} />
            <div className={`${line} w-4/5`} />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div
                className="h-9 rounded-md border-2 border-dashed"
                style={{ borderColor: accent, backgroundColor: soft }}
              />
              <div
                className="h-9 rounded-md border-2 border-dashed"
                style={{ borderColor: accent, backgroundColor: soft }}
              />
            </div>
          </div>
        </div>
      );
    case "storybook":
      return (
        <div aria-hidden className={frame}>
          <div className="space-y-2 p-3">
            <div className="h-16 rounded-md" style={{ backgroundColor: soft }}>
              <div
                className="ml-3 mt-3 h-6 w-6 rounded-full"
                style={{ backgroundColor: accent }}
              />
            </div>
            <div className={`${line} h-2 w-3/4`} />
            <div className={`${line} h-2 w-1/2`} />
          </div>
        </div>
      );
    case "timeline":
      return (
        <div aria-hidden className={`${frame} relative`}>
          <div
            className="absolute bottom-3 left-6 top-3 w-0.5"
            style={{ backgroundColor: accent }}
          />
          <div className="space-y-3.5 py-3 pl-10 pr-3">
            {[0, 1, 2].map((n) => (
              <div key={n} className="relative">
                <span
                  className="absolute -left-[22px] top-0 h-3 w-3 rounded-full border-2 border-white dark:border-[#0B1220]"
                  style={{ backgroundColor: accent }}
                />
                <div className={`${line} w-full`} />
                <div className={`${line} mt-1 w-2/3`} />
              </div>
            ))}
          </div>
        </div>
      );
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F2F9FD] text-[#14213D] dark:bg-[#0B1220] dark:text-[#E8EEFF]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[#FFE45E] focus:px-4 focus:py-2 focus:font-bold focus:text-[#14213D]"
      >
        Skip to content
      </a>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" aria-label="ProjectKids home">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-bold underline underline-offset-4"
            >
              Sign in
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm font-bold underline underline-offset-4"
            >
              My projects
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main id="main">
        {/* Hero: the form is the first thing a child can do, the sample sheet shows the result */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-14">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Type a topic. Get a finished school project.
              </h1>
              <p className={`max-w-prose text-lg ${BODY_TEXT}`}>
                Pictures, an introduction, a summary and a bibliography, all in
                one PDF. Written for your age and built from real web pages.
              </p>
            </div>
            <div className="max-w-xl">
              <HeroTopicForm />
            </div>
          </div>
          <HeroProjectDemo />
        </section>

        {/* How it works - a real sequence, so numbered */}
        <section
          aria-labelledby="how-title"
          className="border-y-2 border-[#14213D] bg-white py-16 dark:border-[#E8EEFF] dark:bg-[#17203A]"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="how-title" className={SECTION_TITLE}>
              From topic to PDF in three steps
            </h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#14213D] bg-[#FFE45E] font-[family-name:var(--font-display)] text-lg font-extrabold text-[#14213D] dark:border-[#E8EEFF]"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-extrabold">
                      {step.title}
                    </h3>
                    <p className={`mt-1 ${BODY_TEXT}`}>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Templates */}
        <section
          aria-labelledby="templates-title"
          className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
        >
          <div className="max-w-2xl">
            <h2 id="templates-title" className={SECTION_TITLE}>
              Four templates, and you can switch any time
            </h2>
            <p className={`mt-3 text-lg ${BODY_TEXT}`}>
              The words stay the same. Only the layout changes, so try them all
              before you print.
            </p>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATE_LIST.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-4 rounded-2xl border-2 border-[#14213D] bg-white p-4 dark:border-[#E8EEFF] dark:bg-[#17203A]"
              >
                <TemplateSketch
                  id={t.id}
                  accent={t.accent}
                  soft={t.accentSoft}
                />
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-extrabold">
                    <span aria-hidden>{t.emoji} </span>
                    {t.name}
                  </h3>
                  <p className={`mt-1 text-sm ${BODY_TEXT}`}>{t.description}</p>
                  <p
                    className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-[#14213D]"
                    style={{ backgroundColor: t.accentSoft }}
                  >
                    Best for: {t.bestFor}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Reading levels + what's inside */}
        <section
          aria-labelledby="levels-title"
          className="border-y-2 border-[#14213D] bg-[#FFE45E]/30 py-20 dark:border-[#E8EEFF] dark:bg-[#FFE45E]/5"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 id="levels-title" className={SECTION_TITLE}>
                The same fact, at three reading levels
              </h2>
              <p className={`mb-6 mt-3 text-lg ${BODY_TEXT}`}>
                Pick the level that fits. Younger readers get shorter sentences
                and bigger text. Older readers get more detail and dates.
              </p>
              <ReadingLevelDemo />
            </div>
            <div>
              <h2 className={SECTION_TITLE}>Every project includes</h2>
              <ul className="mt-6 space-y-3">
                {INSIDE.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-lg">
                    <span
                      aria-hidden
                      className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14A38B] text-xs font-extrabold text-white"
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Grown-ups */}
        <section
          aria-labelledby="grownups-title"
          className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
        >
          <h2 id="grownups-title" className={SECTION_TITLE}>
            For parents and teachers
          </h2>
          <dl className="mt-10 grid gap-8 md:grid-cols-3">
            {GROWN_UP_NOTES.map((note) => (
              <div
                key={note.title}
                className="border-l-4 border-[#0E7FC1] pl-4"
              >
                <dt className="font-[family-name:var(--font-display)] text-lg font-extrabold">
                  {note.title}
                </dt>
                <dd className={`mt-1 ${BODY_TEXT}`}>{note.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Closing call to action */}
        <section
          aria-labelledby="cta-title"
          className="mx-auto max-w-6xl px-4 pb-24 sm:px-6"
        >
          <div className="rounded-3xl border-2 border-[#14213D] bg-[#0E7FC1] px-6 py-12 text-center text-white shadow-[8px_8px_0_#14213D] dark:border-[#E8EEFF] dark:shadow-[8px_8px_0_#E8EEFF] sm:px-12">
            <h2
              id="cta-title"
              className="font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl"
            >
              Got a project due? Start it now.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-white/90">
              Sign in, type your topic and have a draft ready in about a minute.
            </p>
            <div className="mt-8">
              <HomeCta label="Start a project" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-[#14213D]/15 py-8 dark:border-[#E8EEFF]/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark />
          <p className={`max-w-md text-sm ${BODY_TEXT}`}>
            Projects are written from the web pages listed in each bibliography.
            Read those pages too, and check anything important.
          </p>
        </div>
      </footer>
    </div>
  );
}
