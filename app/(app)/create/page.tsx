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
import { stickerButton } from "@/components/Styles";

const CHOICE =
  "rounded-xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE45E]";

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
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
          New project
        </h1>
        <p className="text-muted-foreground">
          Tell us the topic. We find the facts, pictures and sources.
        </p>
      </header>

      <div>
        <label htmlFor="topic" className="mb-1 block text-sm font-bold">
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
          className="w-full rounded-lg border-2 bg-transparent px-3 py-2 text-lg"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Reading level</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {AGE_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={ageGroup === g}
              onClick={() => setAgeGroup(g)}
              className={cn(
                CHOICE,
                ageGroup === g
                  ? "border-[#14213D] bg-[#FFE45E]/40 dark:border-[#FFE45E]"
                  : "border-border",
              )}
            >
              <span className="text-xl">{AGE_LABELS[g].emoji}</span>
              <span className="block font-bold">{AGE_LABELS[g].label}</span>
              <span className="text-xs text-muted-foreground">
                {AGE_LABELS[g].hint}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Template</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATE_LIST.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={template === t.id}
              onClick={() => setTemplate(t.id)}
              style={
                template === t.id
                  ? {
                      borderColor: t.accent,
                      backgroundColor: `${t.accentSoft}66`,
                    }
                  : undefined
              }
              className={cn(CHOICE, template !== t.id && "border-border")}
            >
              <span className="font-bold">
                {t.emoji} {t.name}
              </span>
              <span className="block text-sm text-muted-foreground">
                {t.description}
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: t.accent }}
              >
                Best for: {t.bestFor}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="sections" className="mb-1 block text-sm font-bold">
            Sections: {sectionCount}
          </label>
          <input
            id="sections"
            type="range"
            min={MIN_SECTIONS}
            max={MAX_SECTIONS}
            value={sectionCount}
            onChange={(e) => setSectionCount(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="student" className="mb-1 block text-sm font-bold">
            Name on the cover (optional)
          </label>
          <input
            id="student"
            maxLength={60}
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full rounded-lg border-2 bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || topic.trim().length < 3}
        className={cn(stickerButton, "disabled:opacity-60")}
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
