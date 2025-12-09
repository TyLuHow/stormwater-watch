"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  Shield,
  Microscope,
  Bell,
  Settings,
  FileText,
  Droplet,
  ChevronDown,
  Info,
  Building2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

// VIOLATIONS-FIRST NAVIGATION STRUCTURE
// Per domain expert feedback: "I want a way to quickly access hard data related to stormwater violations"
// Navigation prioritizes violations and exceedances for professional water quality users
// General eSMR data browsing is deprioritized (users can pull data from eSMR directly if needed)

const navigationItems = [
  {
    title: "Violations",
    icon: AlertTriangle,
    href: "/dashboard",
    description: "Primary entry point - active violation events and exceedances",
  },
  {
    title: "Facilities",
    icon: Building2,
    href: "/facilities",
    description: "Facility-specific compliance data (violations shown first)",
    badge: "Soon",
  },
  {
    title: "Alerts",
    icon: Bell,
    href: "/subscriptions",
    description: "Create polygon-based violation alert subscriptions",
  },
  {
    title: "Enforcement",
    icon: Shield,
    items: [
      {
        title: "Case Packets",
        href: "/reports/case-packets",
        description: "Attorney-ready violation reports",
        badge: "Soon",
      },
      {
        title: "SMARTS Actions",
        href: "/violations/smarts",
        description: "Official enforcement records",
        badge: "Soon",
      },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    items: [
      {
        title: "Trends",
        href: "/analytics/trends",
        description: "Historical violation patterns",
        badge: "Soon",
      },
      {
        title: "Regional Scores",
        href: "/analytics/regional",
        description: "Compliance scoring by region",
        badge: "Soon",
      },
    ],
  },
  {
    title: "About",
    icon: Info,
    href: "/about",
    description: "Mission, features, and data sources",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Droplet className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">Stormwater Watch</span>
            <span className="text-xs text-muted-foreground">CA Water Quality</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4">
            Monitoring
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = item.href ? pathname === item.href : false
                const hasSubItems = item.items && item.items.length > 0

                if (!hasSubItems) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href!}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                // Expandable menu item (for SMARTS multi-level navigation)
                return (
                  <Collapsible
                    key={item.title}
                    defaultOpen={item.items?.some((sub) => pathname === sub.href)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const isSubActive = pathname === subItem.href
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={isSubActive}>
                                  <Link href={subItem.href}>
                                    <span className="flex-1">{subItem.title}</span>
                                    {subItem.badge && (
                                      <span className="status-badge bg-muted text-muted-foreground border-0 px-1.5 py-0.5">
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Future: Add quick filters or recent items here */}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Microscope className="h-4 w-4" />
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-medium">Laboratory Mode</span>
            <span className="text-muted-foreground">Clinical UI Active</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
