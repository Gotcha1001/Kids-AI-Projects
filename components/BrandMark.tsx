import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// Logo uses the same glowing cyan "core" as the generating modal.
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-stone-50",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/50 bg-gradient-to-br from-cyan-700 to-cyan-500 text-[#04070a] shadow-[0_0_18px_-3px_rgba(34,211,238,0.9)]"
      >
        <BookOpen size={16} strokeWidth={2.5} />
      </span>
      ProjectKids
    </span>
  );
}
