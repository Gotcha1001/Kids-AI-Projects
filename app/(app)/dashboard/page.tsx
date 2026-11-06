"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { TEMPLATES } from "@/convex/constants";
import { STATUS_LABELS, isInProgress, type ProjectListItem } from "@/lib/types";
import { formatDate } from "@/lib/projectText";
import { getErrorMessage } from "@/lib/errors";
import { hudChip, stickerButton } from "@/components/Styles";

function ProjectCard({ p }: { p: ProjectListItem }) {
  const remove = useMutation(api.projects.remove);
  const meta = TEMPLATES[p.template];

  async function onDelete(): Promise<void> {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    try {
      await remove({ projectId: p._id });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <li className="hud-panel overflow-hidden">
      <Link
        href={`/p/${p.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
      >
        <div className="flex h-36 items-center justify-center border-b border-cyan-400/20 bg-cyan-400/5">
          {p.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.coverUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-4xl" aria-hidden>
              {meta.emoji}
            </span>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <h2 className="line-clamp-1 font-[family-name:var(--font-display)] text-lg font-bold text-stone-50">
            {p.title}
          </h2>
          <p className="font-mono text-xs text-stone-400">
            {meta.name} · {formatDate(p.createdAt)}
          </p>
          <span className={hudChip}>
            {isInProgress(p.status) ? "⏳ " : ""}
            {STATUS_LABELS[p.status]}
          </span>
        </div>
      </Link>
      <div className="flex justify-end border-t border-cyan-400/15 px-3 py-2">
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${p.title}`}
          className="rounded p-1 text-stone-400 transition hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const projects = useQuery(api.projects.list);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-stone-50">
          My projects
        </h1>
        <Link href="/create" className={stickerButton}>
          New project
        </Link>
      </header>

      {projects === undefined ? (
        <p className="font-mono text-sm text-cyan-200/80">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cyan-400/30 bg-[#0a1219]/60 p-10 text-center">
          <p className="mb-4 text-lg text-stone-200">
            No projects yet. Try “Aquatic animals” or “History of South Africa”.
          </p>
          <Link href="/create" className={stickerButton}>
            Start my first project
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p._id} p={p} />
          ))}
        </ul>
      )}
    </div>
  );
}
