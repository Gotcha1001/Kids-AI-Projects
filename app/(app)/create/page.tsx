"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import {
  AGE_GROUPS,
  MAX_SECTIONS,
  MIN_SECTIONS,
  TEMPLATE_LIST,
  type AgeGroup,
  type TemplateId,
} from "@/convex/constants";
import { AGE_LABELS } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  hudChoice,
  hudChoiceOff,
  hudChoiceOn,
  hudInput,
  hudLabel,
  stickerButton,
} from "@/components/Styles";

function CreateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const createProject = useMutation(api.projects.create);

  const [topic, setTopic] = useState<string>(params.get("topic") ?? "");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("8-10");
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [sectionCount, setSectionCount] = useState<number>(4);
  const [studentName, setStudentName] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const { slug } = await createProject({
        topic,
        ageGroup,
        template,
        sectionCount,
        ...(studentName.trim() ? { studentName } : {}),
      });
      router.push(`/p/${slug}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="hud-panel mx-auto max-w-3xl space-y-8 p-6 sm:p-8"
    >
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-stone-50">
          New project
        </h1>
        <p className="mt-1 text-stone-400">
          Tell us the topic. We find the facts, pictures and sources.
        </p>
      </header>

      <div>
        <label htmlFor="topic" className={hudLabel}>
          My project is about
        </label>
        <input
          id="topic"
          required
          minLength={3}
          maxLength={120}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="History of South Africa"
          className={cn(hudInput, "text-lg")}
        />
      </div>

      <fieldset>
        <legend className={hudLabel}>Reading level</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {AGE_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={ageGroup === g}
              onClick={() => setAgeGroup(g)}
              className={cn(
                hudChoice,
                ageGroup === g ? hudChoiceOn : hudChoiceOff,
              )}
            >
              <span className="text-xl">{AGE_LABELS[g].emoji}</span>
              <span className="block font-bold text-stone-50">
                {AGE_LABELS[g].label}
              </span>
              <span className="text-xs text-stone-400">
                {AGE_LABELS[g].hint}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={hudLabel}>Template</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATE_LIST.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={template === t.id}
              onClick={() => setTemplate(t.id)}
              className={cn(
                hudChoice,
                template === t.id ? hudChoiceOn : hudChoiceOff,
              )}
            >
              <span className="font-bold text-stone-50">
                {t.emoji} {t.name}
              </span>
              <span className="block text-sm text-stone-400">
                {t.description}
              </span>
              <span className="font-mono text-xs font-semibold text-cyan-300">
                Best for: {t.bestFor}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="sections" className={hudLabel}>
            Sections: <span className="text-cyan-300">{sectionCount}</span>
          </label>
          <input
            id="sections"
            type="range"
            min={MIN_SECTIONS}
            max={MAX_SECTIONS}
            value={sectionCount}
            onChange={(e) => setSectionCount(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>
        <div>
          <label htmlFor="student" className={hudLabel}>
            Name on the cover (optional)
          </label>
          <input
            id="student"
            maxLength={60}
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className={hudInput}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || topic.trim().length < 3}
        className={stickerButton}
      >
        {submitting ? "Starting…" : "Make my project"}
      </button>
    </form>
  );
}

export default function CreatePage() {
  // useSearchParams needs a Suspense boundary in the App Router
  return (
    <Suspense fallback={null}>
      <CreateForm />
    </Suspense>
  );
}
