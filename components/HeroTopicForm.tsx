"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { stickerButton } from "./Styles";

const IDEAS: string[] = [
  "History of South Africa",
  "Aquatic animals",
  "The Big Five",
  "The Solar System",
  "Ancient Egypt",
  "Rainforests",
];

export function HeroTopicForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [topic, setTopic] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const clean = topic.trim();
    // /create is protected: signed-out visitors are sent to sign in, then land back here with the topic
    router.push(
      clean.length >= 3
        ? `/create?topic=${encodeURIComponent(clean)}`
        : "/create",
    );
  }

  function pick(idea: string): void {
    setTopic(idea);
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="hero-topic"
          className="mb-1 block text-sm font-bold text-[#14213D] dark:text-[#E8EEFF]"
        >
          My project is about
        </label>
        <input
          id="hero-topic"
          ref={inputRef}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={120}
          autoComplete="off"
          placeholder="Aquatic animals"
          className="w-full border-0 border-b-4 border-[#14213D] bg-transparent px-1 py-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[#14213D] placeholder:text-[#14213D]/30 focus:border-[#14A38B] focus:outline-none focus-visible:ring-0 dark:border-[#E8EEFF] dark:text-[#E8EEFF] dark:placeholder:text-[#E8EEFF]/30 dark:focus:border-[#FFE45E] sm:text-3xl"
        />
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Topic ideas"
      >
        {IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => pick(idea)}
            className="rounded-full border border-[#14213D]/25 bg-white/70 px-3 py-1 text-sm text-[#14213D] hover:border-[#14213D] hover:bg-[#FFE45E]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14A38B] dark:border-[#E8EEFF]/25 dark:bg-white/5 dark:text-[#E8EEFF] dark:hover:border-[#E8EEFF] dark:hover:bg-[#FFE45E]/20"
          >
            {idea}
          </button>
        ))}
      </div>

      <button type="submit" className={stickerButton}>
        Start my project
      </button>
    </form>
  );
}
