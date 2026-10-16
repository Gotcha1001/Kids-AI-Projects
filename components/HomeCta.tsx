"use client";

import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import { stickerButton } from "./Styles";

export function HomeCta({ label = "Start a project" }: { label?: string }) {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <Link href="/create" className={stickerButton}>
        {label}
      </Link>
    );
  }
  return (
    <SignInButton mode="modal" forceRedirectUrl="/create">
      <button type="button" className={stickerButton}>
        {label}
      </button>
    </SignInButton>
  );
}
