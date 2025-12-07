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

// Navigation items structure (SMARTS-ready with expandable sections)
const navigationItems = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Violations",
    icon: AlertTriangle,
    items: [
      {
        title: "eSMR Computed",
        href: "/dashboard",
        description: "Water quality violations from monitoring data",
      },
      {
        title: "SMARTS Regulatory",
        href: "/violations/smarts",
        description: "Official violation records (coming soon)",
        badge: "Soon",
      },
      {
        title: "All Violations",
        href: "/violations",
        description: "Unified view of all violations",
      },
    ],
  },
  {
    title: "Enforcement",
    icon: Shield,
    items: [
      {
        title: "Actions",
        href: "/enforcement/actions",
        description: "NOVs, penalties, compliance orders",
        badge: "Soon",
      },
      {
        title: "Inspections",
        href: "/enforcement/inspections",
        description: "Inspection history and findings",
        badge: "Soon",
      },
    ],
  },
  {
    title: "Data Sources",
    icon: Droplet,
    items: [
      {
        title: "eSMR Monitoring",
        href: "/esmr",
        description: "Self-reported monitoring data",
      },
      {
        title: "SMARTS Data",
        href: "/smarts",
        description: "Regulatory system records (coming soon)",
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
        description: "Historical patterns and forecasts",
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
    title: "Alerts",
    icon: Bell,
    href: "/subscriptions",
  },
  {
    title: "Reports",
    icon: FileText,
    items: [
      {
        title: "Case Packets",
        href: "/reports/case-packets",
        description: "Attorney-ready violation reports",
        badge: "Soon",
      },
      {
        title: "Custom Reports",
        href: "/reports/custom",
        description: "Build custom data exports",
        badge: "Soon",
      },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
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
