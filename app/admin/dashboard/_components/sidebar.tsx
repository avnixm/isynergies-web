"use client"

import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Mail,
  Film,
  FileText,
  Users,
  Wrench,
  FolderKanban,
  Users2,
  ShoppingCart,
  Settings,
  LogOut,
  User as UserIcon,
} from "lucide-react"

import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"

type SidebarProps = {
  pathname: string
  user: { username?: string; email?: string } | null
  onLogout: () => void
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/messages", label: "Messages", icon: Mail },
  { href: "/admin/dashboard/hero", label: "Hero Section", icon: Film },
  { href: "/admin/dashboard/about-us", label: "About Us", icon: FileText },
  {
    href: "/admin/dashboard/board-members",
    label: "Board of Directors",
    icon: Users,
  },
  { href: "/admin/dashboard/services", label: "Services", icon: Wrench },
  { href: "/admin/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/dashboard/team", label: "Team Members", icon: Users2 },
  { href: "/admin/dashboard/shop", label: "Shop", icon: ShoppingCart },
  {
    href: "/admin/dashboard/site-settings",
    label: "Site Settings",
    icon: Settings,
  },
]

export function Sidebar({ pathname, user, onLogout }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 bg-white text-gray-800 flex-col border-r border-border">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="relative h-12 w-full">
          <Image
            src="/logos/isynergiesinclogo.png"
            alt="iSynergies Inc."
            fill
            className="object-contain"
          />
        </div>
        <p className="text-xs text-gray-800 mt-2">Admin CMS</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-800 hover:bg-accent/10 hover:text-gray-800"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-white" : "text-gray-800 group-hover:text-gray-800"
                )}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-gray-800" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-gray-800">
              {user?.username ?? "Administrator"}
            </p>
            <p className="text-xs text-gray-800 truncate">
              {user?.email ?? "admin"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-center"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Logout
        </Button>
      </div>
    </aside>
  )
}


