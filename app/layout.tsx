// app/layout.tsx - providers only. The sidebar lives in app/(app)/layout.tsx
// so the landing page and shared /p/[slug] pages stay clean.
// HUD theme: dark only, with the rain/grid backdrop behind every page.
import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes"; // npm i @clerk/themes
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { ConvexClientProvider } from "./ConvexClientProvider";
import Provider from "./provider";
import { fontVariables } from "./fonts";
import { HudBackground } from "@/components/HudBackground";

export const metadata: Metadata = {
  title: "ProjectKids - school projects, made easy",
  description:
    "Type a topic, pick a template and get a finished school project with pictures, a summary and a bibliography. Download it as a PDF.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: "#22d3ee", colorBackground: "#0a1219" },
      }}
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={`${fontVariables} font-[family-name:var(--font-body)] antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
          >
            <HudBackground />
            <ConvexClientProvider>
              <Provider>{children}</Provider>
              <Toaster richColors theme="dark" />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
