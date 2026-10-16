"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { STALE_MS, TEMPLATE_LIST, type TemplateId } from "@/convex/constants";
import { STATUS_LABELS, isInProgress, toProjectView } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";
import { useDownloadPdf } from "@/hooks/useDownloadPdf";
import { ProjectPreview } from "@/app/components/ProjectPreview";
import { BrandMark } from "@/components/BrandMark";
import { ProjectGeneratingModal } from "@/components/ProjectGeneratingModal";
import { stickerButton } from "@/components/Styles";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SMALL_BTN =
  "rounded-lg border-2 px-3 py-1.5 text-sm font-bold hover:bg-muted disabled:opacity-60";

export default function ProjectPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const data = useQuery(api.projects.getBySlug, { slug });

  const updateMeta = useMutation(api.projects.updateMeta);
  const setPublic = useMutation(api.projects.setPublic);
  const regenerate = useMutation(api.projects.regenerate);
  const remove = useMutation(api.projects.remove);

  const view = data ? toProjectView(data.project) : null;
  const { download, isBuilding } = useDownloadPdf(view);
  const [busy, setBusy] = useState<boolean>(false);

  // Ticking clock so a stuck project is noticed even if no data changes
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  async function run(action: () => Promise<unknown>): Promise<void> {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const header = (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Link href="/">
        <BrandMark />
      </Link>
      <Link href="/dashboard" className="text-sm font-bold underline">
        My projects
      </Link>
    </header>
  );

  if (data === undefined)
    return (
      <div>
        {header}
        <p className="p-8 text-muted-foreground">Loading…</p>
      </div>
    );
  if (data === null) {
    return (
      <div>
        {header}
        <div className="p-10 text-center">
          <h1 className="mb-2 text-2xl font-bold">Project not found</h1>
          <p className="mb-4 text-muted-foreground">
            It may be private or deleted.
          </p>
          <Link href="/create" className={stickerButton}>
            Make a new one
          </Link>
        </div>
      </div>
    );
  }

  const { project, isOwner } = data;
  const projectId: Id<"projects"> = project._id;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${project.slug}`
      : "";
  const inProgress = isInProgress(project.status);
  const isStale = now - project.updatedAt > STALE_MS;

  return (
    <div>
      {header}

      {/* Owner sees the full-screen modal while the project is being made */}
      <ProjectGeneratingModal
        open={isOwner && inProgress}
        status={project.status}
        statusMessage={project.statusMessage}
        topic={project.topic}
        template={project.template}
        sectionCount={project.sectionCount}
        footer={
          isStale ? (
            <div>
              <p className="mb-2 text-sm text-[#14213D] dark:text-[#E8EEFF]">
                This is taking much longer than usual.
              </p>
              <button
                type="button"
                disabled={busy}
                className={SMALL_BTN}
                onClick={() => run(() => regenerate({ projectId }))}
              >
                Start again
              </button>
            </div>
          ) : null
        }
      />

      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
        {/* Anyone else (shared link) gets the simple inline card, no modal */}
        {inProgress && !isOwner && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border-2 p-8 text-center"
          >
            <p className="text-3xl" aria-hidden>
              ⏳
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              {STATUS_LABELS[project.status]}…
            </h1>
            <p className="text-muted-foreground">
              {project.statusMessage ?? "Working on it…"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              This page updates by itself. It usually takes under a minute.
            </p>
          </div>
        )}

        {project.status === "failed" && (
          <div role="alert" className="rounded-2xl border-2 border-red-300 p-6">
            <h1 className="text-xl font-bold">
              We couldn&apos;t finish this one
            </h1>
            <p className="mb-3">
              {project.errorMessage ?? "Something went wrong."}
            </p>
            {isOwner && (
              <button
                type="button"
                disabled={busy}
                className={SMALL_BTN}
                onClick={() => run(() => regenerate({ projectId }))}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {view && isOwner && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 p-3">
            <button
              type="button"
              onClick={download}
              disabled={isBuilding}
              className={SMALL_BTN}
            >
              {isBuilding ? "Building PDF…" : "⬇ Download PDF"}
            </button>
            <select
              aria-label="Template"
              value={project.template}
              disabled={busy}
              className="rounded-lg border-2 bg-transparent px-2 py-1.5 text-sm"
              onChange={(e) =>
                run(() =>
                  updateMeta({
                    projectId,
                    template: e.target.value as TemplateId,
                  }),
                )
              }
            >
              {TEMPLATE_LIST.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy}
              className={SMALL_BTN}
              onClick={() =>
                run(() => setPublic({ projectId, isPublic: !project.isPublic }))
              }
            >
              {project.isPublic ? "🌍 Public" : "🔒 Private"}
            </button>
            {project.isPublic && (
              <button
                type="button"
                className={SMALL_BTN}
                onClick={() =>
                  navigator.clipboard.writeText(shareUrl).then(
                    () => toast.success("Link copied"),
                    () => toast.error("Couldn't copy"),
                  )
                }
              >
                Copy link
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              className={SMALL_BTN}
              onClick={() => run(() => regenerate({ projectId }))}
            >
              ↻ Rewrite
            </button>
            <button
              type="button"
              disabled={busy}
              className={`${SMALL_BTN} text-red-600`}
              onClick={() => {
                if (window.confirm("Delete this project?"))
                  void run(async () => {
                    await remove({ projectId });
                    router.push("/dashboard");
                  });
              }}
            >
              Delete
            </button>
          </div>
        )}

        {view && <ProjectPreview project={view} />}
      </div>
    </div>
  );
}
