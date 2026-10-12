"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FilePlus2, FileText, Settings, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

// /dashboard/create and /dashboard/cvs are built in Phase 2 — the links are
// wired up now so the shell is complete, they just don't have pages yet.
const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/create", label: "Create a CV", icon: FilePlus2 },
  { href: "/dashboard/cvs", label: "My CVs", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-3 py-3">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          <div>
            <p className="text-sm font-semibold text-[#12213A] dark:text-[#F6F1E7]">
              CV Make{" "}
              <span className="text-amber-600 dark:text-amber-400">AI</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              Tailored to the job, not the template
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={pathname === href}>
                  <Link href={href} className="flex items-center gap-2">
                    <Icon size={16} />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <div className="px-3 py-2 border-t border-amber-900/10 dark:border-amber-400/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-medium text-amber-700 dark:text-amber-300">
                {(user.fullName ?? user.username ?? "U").slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-[#12213A] dark:text-[#F6F1E7]">
                  {user.fullName ?? user.username}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
