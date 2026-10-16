// app/(app)/layout.tsx - signed-in shell: navbar + sidebar (transparent so the HUD backdrop shows)
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Navbar from "@/app/components/Navbar";
import { AppSidebar } from "@/app/components/Appsidebar";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-auto bg-transparent">
            <main className="p-4 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
