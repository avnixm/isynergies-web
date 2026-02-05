"use client"

import { useEffect } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Film,
  FileText,
  Briefcase,
  Users,
  Wrench,
  FolderKanban,
  Users2,
  ShoppingCart,
  Settings,
  LogOut,
  User as UserIcon,
  Smartphone,
  X,
} from "lucide-react"

import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"

type SidebarProps = {
  pathname: string
  user: { username?: string; email?: string } | null
  onLogout: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/hero", label: "Hero Section", icon: Film },
  { href: "/admin/dashboard/featured-app", label: "Featured App", icon: Smartphone },
  { href: "/admin/dashboard/services", label: "Services", icon: Wrench },
  { href: "/admin/dashboard/what-we-do", label: "What We Do", icon: Briefcase },
  { href: "/admin/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/dashboard/shop", label: "Shop", icon: ShoppingCart },
  { href: "/admin/dashboard/about-us", label: "About Us", icon: FileText },
  {
    href: "/admin/dashboard/board-members",
    label: "Board of Directors",
    icon: Users,
  },
  { href: "/admin/dashboard/team", label: "Our Team", icon: Users2 },
  { href: "/admin/dashboard/messages", label: "Contact Us", icon: FileText },
  {
    href: "/admin/dashboard/site-settings",
    label: "Site Settings",
    icon: Settings,
  },
]

function SidebarContent({
  pathname,
  user,
  onLogout,
  onLinkClick,
  showCloseButton,
  onClose,
}: {
  pathname: string
  user: { username?: string; email?: string } | null
  onLogout: () => void
  onLinkClick?: () => void
  showCloseButton?: boolean
  onClose?: () => void
}) {
  return (
    <>
      <div className="p-6 border-b border-border flex-shrink-0 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-primary truncate">iSynergies Inc.</p>
          <p className="text-xs text-gray-800 mt-1">Admin CMS</p>
        </div>
        {showCloseButton && onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-lg md:hidden shrink-0"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X className="h-5 w-5 text-gray-800" />
          </Button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden min-h-0">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
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

      <div className="p-4 border-t border-border space-y-3 flex-shrink-0">
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
    </>
  )
}

export function Sidebar({ pathname, user, onLogout, mobileOpen = false, onMobileClose }: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen || !onMobileClose) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose()
    }
    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [mobileOpen, onMobileClose])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 h-full bg-white text-gray-800 flex-col border-r border-border overflow-hidden flex-shrink-0">
        <SidebarContent pathname={pathname} user={user} onLogout={onLogout} />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && onMobileClose && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-hidden
            onClick={onMobileClose}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-white text-gray-800 flex flex-col border-r border-border shadow-xl md:hidden"
            aria-modal
            aria-label="Navigation menu"
          >
            <SidebarContent
              pathname={pathname}
              user={user}
              onLogout={onLogout}
              onLinkClick={onMobileClose}
              showCloseButton
              onClose={onMobileClose}
            />
          </aside>
        </>
      )}
    </>
  )
}


