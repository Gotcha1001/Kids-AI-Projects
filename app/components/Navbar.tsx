"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BrandMark } from "@/components/BrandMark";

// HUD navbar: frosted dark glass with a thin cyan edge. (ThemeToggle removed: the app is dark-only now.)
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-cyan-400/20 bg-[#04070a]/70 px-4 py-3 shadow-[0_1px_30px_-12px_rgba(34,211,238,0.5)] backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-cyan-200 md:hidden" />
        <Link href="/" aria-label="ProjectKids home">
          <BrandMark />
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <SignedOut>
          <Link href="/sign-in">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Sign up</Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}
