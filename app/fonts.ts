// app/fonts.ts
// Bricolage Grotesque: headlines. Atkinson Hyperlegible: body (easy for young readers).
// JetBrains Mono: HUD readouts, labels and the rain (exposed as --font-hud / font-mono).
import {
  Atkinson_Hyperlegible,
  Bricolage_Grotesque,
  JetBrains_Mono,
} from "next/font/google";

export const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const bodyFont = Atkinson_Hyperlegible({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const hudFont = JetBrains_Mono({
  variable: "--font-hud",
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = `${displayFont.variable} ${bodyFont.variable} ${hudFont.variable}`;
