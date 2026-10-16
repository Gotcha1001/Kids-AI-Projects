// hooks/useDownloadPdf.tsx
"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { loadImageDataUrls } from "@/lib/imageProxy";
import { safeFileName } from "@/lib/projectText";
import type { ProjectView } from "@/lib/types";

interface UseDownloadPdf {
  download: () => Promise<void>;
  isBuilding: boolean;
}

export function useDownloadPdf(project: ProjectView | null): UseDownloadPdf {
  const [isBuilding, setIsBuilding] = useState(false);

  const download = useCallback(async (): Promise<void> => {
    if (!project || isBuilding) return;
    setIsBuilding(true);
    try {
      // react-pdf touches browser APIs, so it is only imported on click (never during SSR)
      const [{ pdf }, { ProjectPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf/ProjectPdf"),
      ]);
      const pdfSafeUrls = project.images
        .filter((i) => i.pdfSafe)
        .map((i) => i.url);
      const imageData = await loadImageDataUrls(pdfSafeUrls);
      const blob = await pdf(
        <ProjectPdf project={project} imageData={imageData} />,
      ).toBlob();

      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = safeFileName(project.title);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      console.error("[pdf] build failed", e);
      toast.error("We couldn't build the PDF. Please try again.");
    } finally {
      setIsBuilding(false);
    }
  }, [project, isBuilding]);

  return { download, isBuilding };
}
