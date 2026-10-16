// Web preview of a finished project. One component, four looks driven by project.template.
import type { CSSProperties } from "react";
import { TEMPLATES } from "@/convex/constants";
import { AGE_LABELS, type ProjectView } from "@/lib/types";
import { formatDate, splitParagraphs } from "@/lib/projectText";
import { cn } from "@/lib/utils";

export function ProjectPreview({ project }: { project: ProjectView }) {
  const meta = TEMPLATES[project.template];
  const vars = {
    "--accent": meta.accent,
    "--soft": meta.accentSoft,
  } as CSSProperties;
  const isStory = project.template === "storybook";
  const isTimeline = project.template === "timeline";
  const isClassic = project.template === "classic";

  const funFacts =
    project.funFacts.length > 0 ? (
      <aside className="grid gap-3 sm:grid-cols-2" aria-label="Did you know?">
        {project.funFacts.map((fact) => (
          <p
            key={fact}
            className="rounded-xl p-4 text-sm font-semibold"
            style={{ backgroundColor: "var(--soft)" }}
          >
            💡 Did you know? {fact}
          </p>
        ))}
      </aside>
    ) : null;

  return (
    <article
      style={vars}
      className="mx-auto max-w-3xl space-y-10 rounded-2xl border bg-white p-6 text-slate-800 shadow-sm sm:p-10"
    >
      <header
        className="rounded-xl p-8 text-white"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest opacity-90">
          {project.topic}
        </p>
        <h1 className="my-2 font-[family-name:var(--font-display)] text-4xl font-extrabold">
          {project.title}
        </h1>
        <p className="text-sm opacity-90">
          {project.studentName ? `By ${project.studentName} · ` : ""}
          {AGE_LABELS[project.ageGroup].label} · {formatDate(project.createdAt)}
        </p>
      </header>

      <section>
        <h2
          className="mb-3 font-[family-name:var(--font-display)] text-2xl font-bold"
          style={{ color: "var(--accent)" }}
        >
          Introduction
        </h2>
        {splitParagraphs(project.intro).map((para) => (
          <p key={para} className="mb-3 leading-relaxed">
            {para}
          </p>
        ))}
      </section>

      {project.template === "factfile" && funFacts}

      <div
        className={cn("space-y-10", isTimeline && "border-l-4 pl-6")}
        style={isTimeline ? { borderColor: "var(--accent)" } : undefined}
      >
        {project.sections.map((section, i) => {
          const image =
            section.imageIndex !== undefined
              ? project.images[section.imageIndex]
              : undefined;
          return (
            <section key={section.heading} className="relative">
              {isTimeline && (
                <span
                  aria-hidden
                  className="absolute -left-[34px] top-1.5 h-4 w-4 rounded-full border-4 border-white"
                  style={{ backgroundColor: "var(--accent)" }}
                />
              )}
              <h2
                className={cn(
                  "mb-3 font-[family-name:var(--font-display)] font-bold",
                  isStory ? "text-3xl" : "text-2xl",
                )}
                style={{ color: "var(--accent)" }}
              >
                {isClassic ? `${i + 1}. ` : ""}
                {section.heading}
              </h2>
              {image && (
                <figure className="mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.caption}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className={cn(
                      "w-full rounded-xl object-cover",
                      isStory ? "max-h-96" : "max-h-72",
                    )}
                  />
                  <figcaption className="mt-1 text-xs text-slate-500">
                    {image.caption}
                  </figcaption>
                </figure>
              )}
              {splitParagraphs(section.body).map((para) => (
                <p
                  key={para}
                  className={cn("mb-3 leading-relaxed", isStory && "text-lg")}
                >
                  {para}
                </p>
              ))}
              {section.sourceRefs.length > 0 && (
                <p className="text-xs text-slate-500">
                  Sources: {section.sourceRefs.map((n) => `[${n}]`).join(" ")}
                </p>
              )}
            </section>
          );
        })}
      </div>

      {project.template !== "factfile" && funFacts}

      {project.glossary.length > 0 && (
        <section>
          <h2
            className="mb-3 font-[family-name:var(--font-display)] text-2xl font-bold"
            style={{ color: "var(--accent)" }}
          >
            Word list
          </h2>
          <dl className="space-y-2">
            {project.glossary.map((g) => (
              <div key={g.term}>
                <dt className="inline font-bold">{g.term}: </dt>
                <dd className="inline">{g.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section
        className="rounded-xl p-6"
        style={{ backgroundColor: "var(--soft)" }}
      >
        <h2
          className="mb-2 font-[family-name:var(--font-display)] text-2xl font-bold"
          style={{ color: "var(--accent)" }}
        >
          Summary
        </h2>
        {splitParagraphs(project.summary).map((para) => (
          <p key={para} className="mb-2 leading-relaxed">
            {para}
          </p>
        ))}
      </section>

      <section>
        <h2
          className="mb-3 font-[family-name:var(--font-display)] text-2xl font-bold"
          style={{ color: "var(--accent)" }}
        >
          Bibliography
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {project.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
