'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Logo from "./Logo"
import { Input } from "./ui/input"
import { Clock, Download, File, HelpCircleIcon, Home, Image, LucideIcon, Settings, Star, Video } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useMemo, useState } from "react"
import { tools } from "@/lib/tools"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

const group1: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Video Tools",
    href: "/tools/video",
    icon: Video,
  },
  {
    title: "Image Tools",
    href: "/tools/image",
    icon: Image,
  },
  {
    title: "Document Tools",
    href: "/tools/pdf",
    icon: File,
  }
]

export function AppSidebar() {
  const pathname = usePathname()
  const [query, setQuery] = useState('')

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return tools.filter((tool) => tool.title.toLowerCase().includes(q))
  }, [query])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  return (
    <Sidebar className="p-4 bg-sidebar">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <div className="px-4 py-2">
          <Input
            placeholder="🔎  Search..."
            className="border border-foreground/20"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <SidebarGroup>
          <SidebarMenu>
            {(filteredTools ?? group1).map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem
                  key={item.title}
                  className={"flex gap-2 items-center hover:bg-background p-2" + (isActive(item.href) ? " bg-background border-l-2 border-primary" : "")}>
                  <Icon className="size-5" />
                  <Link href={item.href} className="flex-1">{item.title}</Link>
                </SidebarMenuItem>
              )
            })}
            {filteredTools && filteredTools.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">No tools match “{query}”.</p>
            )}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/tools/recent" />}>
                <Clock />
                <span>Recent Files</span>
              </SidebarMenuButton>
            </SidebarMenuItem><SidebarMenuItem>
              <SidebarMenuButton>
                <Download />
                <span>Downloads</span>
              </SidebarMenuButton>
            </SidebarMenuItem><SidebarMenuItem>
              <SidebarMenuButton>
                <Star />
                <span>Favourites</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter><SidebarMenuItem>
        <SidebarMenuButton render={<Link href="/tools/settings" />}>
          <Settings />
          <span>Settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem><SidebarMenuItem>
          <SidebarMenuButton>
            <HelpCircleIcon />
            <span>Help and Feedback</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <div className="flex gap-2 items-center text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p>Ready Completely offline</p>
          </div>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  )
}
