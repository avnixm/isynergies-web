"use client"

import { Bell, Menu, ShieldCheck } from "lucide-react"

import { Button } from "@/app/components/ui/button"

type HeaderProps = {
  user: { username?: string } | null
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur">
      <div className="flex h-14 items-center px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mr-1 rounded-lg md:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4 text-gray-800" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-800">
                iSynergies Admin
              </p>
              <p className="text-sm font-semibold leading-tight text-gray-800">
                Dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-lg"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-gray-800" />
          </Button>
          <div className="hidden text-xs text-gray-800 sm:inline-flex">
            Signed in as{" "}
            <span className="ml-1 font-semibold text-gray-800">
              {user?.username ?? "Administrator"}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}


