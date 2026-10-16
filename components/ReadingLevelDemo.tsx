"use client";

import { useId, useState } from "react";
import { AGE_GROUPS, type AgeGroup } from "@/convex/constants";
import { AGE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

// Same fact, three reading levels. Text size also changes, like it does in the real project.
const SAMPLES: Record<AgeGroup, { text: string; size: string }> = {
  "5-7": {
    text: "The blue whale is the biggest animal in the world. It is longer than two school buses! It eats tiny sea animals called krill.",
    size: "text-xl leading-relaxed",
  },
  "8-10": {
    text: "The blue whale is the largest animal that has ever lived. It can grow longer than two school buses parked end to end. Even so, it feeds on krill, which are tiny shrimp-like animals.",
    size: "text-lg leading-relaxed",
  },
  "11-13": {
    text: "Blue whales can reach about 30 metres in length, making them the largest animals known to have existed. They are baleen whales: instead of teeth, they filter huge volumes of water through plates in their mouths to trap krill.",
    size: "text-base leading-relaxed",
  },
};

export function ReadingLevelDemo() {
  const [age, setAge] = useState<AgeGroup>("8-10");
  const baseId = useId();
  const sample = SAMPLES[age];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Reading level"
        className="flex flex-wrap gap-2"
      >
        {AGE_GROUPS.map((a) => {
          const selected = a === age;
          return (
            <button
              key={a}
              id={`${baseId}-tab-${a}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              onClick={() => setAge(a)}
              className={cn(
                "rounded-full border-2 px-4 py-1.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#14A38B]/60",
                selected
                  ? "border-[#14213D] bg-[#FFE45E] text-[#14213D] dark:border-[#E8EEFF]"
                  : "border-[#14213D]/25 text-[#14213D] hover:border-[#14213D] dark:border-[#E8EEFF]/25 dark:text-[#E8EEFF] dark:hover:border-[#E8EEFF]",
              )}
            >
              {AGE_LABELS[a].label}
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${age}`}
        className="mt-5 rounded-2xl border-2 border-[#14213D] bg-white p-6 dark:border-[#E8EEFF] dark:bg-[#17203A]"
      >
        <p
          className={cn(
            "max-w-prose text-[#14213D] dark:text-[#E8EEFF]",
            sample.size,
          )}
        >
          {sample.text}
        </p>
        <p className="mt-4 text-sm text-[#41507A] dark:text-[#A9B6D8]">
          {AGE_LABELS[age].hint}
        </p>
      </div>
    </div>
  );
}
