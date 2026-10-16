"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { FolderOpen, Sparkles, type LucideIcon } from "lucide-react";
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
import { BrandMark } from "@/components/BrandMark";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/create", label: "New project", icon: Sparkles },
  { href: "/dashboard", label: "My projects", icon: FolderOpen },
];

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-3 py-3">
          <BrandMark />
          <p className="mt-1 text-[11px] text-muted-foreground">
            School projects, made easy
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
          <div className="border-t px-3 py-2">
            <p className="truncate text-xs font-semibold">
              {user.fullName ?? user.username}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
