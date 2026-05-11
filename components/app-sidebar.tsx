"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  CalendarClock,
  Percent,
  BarChart3,
  Settings,
  GraduationCap,
  School,
  CalendarDays,
  UserRound,
  ClipboardList,
  CircleDollarSign,
  Wand2,
  Link2,
  FileText,
  BusFront,
  Map,
  MapPin,
  Route,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
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
  SidebarFooter,
} from "@/components/ui/sidebar"

const mainMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: Users },
  { title: "Parents", url: "/parents", icon: UserRound },
  { title: "Student Parents", url: "/student-parents", icon: Link2 },
  { title: "Classes", url: "/classes", icon: School },
  { title: "Fee Structure", url: "/fee-structure", icon: Receipt },
  { title: "Payments", url: "/payments", icon: CreditCard },
]

const managementMenuItems = [
  { title: "Sessions", url: "/sessions", icon: CalendarDays },
  { title: "Fee Components", url: "/fee-components", icon: ClipboardList },
  { title: "Fee Generation", url: "/fee-generation", icon: Wand2 },
  { title: "Installments", url: "/installments", icon: CalendarClock },
  { title: "Discounts", url: "/discounts", icon: Percent },
  { title: "Fines", url: "/fines", icon: CircleDollarSign },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Reports", url: "/reports", icon: BarChart3 },
]

const transportMenuItems = [
  { title: "Routes", url: "/transport/routes", icon: Route },
  { title: "Stops", url: "/transport/stops", icon: MapPin },
  { title: "Policy", url: "/transport/policy", icon: Map },
  { title: "Assignments", url: "/transport/assignments", icon: BusFront },
]

const settingsMenuItems = [{ title: "Settings", url: "/settings", icon: Settings }]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-semibold text-foreground">EduFee</span>
            <span className="text-xs text-muted-foreground">Fee Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-10"
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-10"
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground">
            Transport
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith("/transport")}
                  tooltip="Transport"
                  className="h-10"
                >
                  <BusFront className="size-4" />
                  <span>Transport</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {transportMenuItems.map((item) => (
                    <SidebarMenuSubItem key={item.title}>
                      <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                        <Link href={item.url}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          {settingsMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                tooltip={item.title}
                className="h-10"
              >
                <Link href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
