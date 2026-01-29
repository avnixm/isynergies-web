"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Mail, Menu, ShieldCheck } from "lucide-react"

import { Button } from "@/app/components/ui/button"

type HeaderProps = {
  user: { username?: string } | null
}

export function Header({ user }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        if (!token) {
          
          return
        }
        
        const response = await fetch('/api/admin/contact-messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const messages = await response.json()
          if (Array.isArray(messages)) {
            const newMessages = messages.filter((m: { status: string }) => m.status === 'new')
            setUnreadCount(newMessages.length)
          }
        } else if (response.status === 401) {
          
          console.warn('Unauthorized to fetch messages')
        } else if (response.status === 500) {
          
          
          
        } else {
          console.error('Failed to fetch messages:', response.status)
        }
      } catch (error) {
        
        
      }
    }

    
    fetchUnreadCount()
    
    
    const interval = setInterval(fetchUnreadCount, 30000)
    
    
    const handleFocus = () => {
      fetchUnreadCount()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur overflow-x-hidden">
      <div className="flex h-14 items-center px-4 md:px-6 w-full max-w-full">
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
          <Link href="/admin/dashboard/messages">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative rounded-lg"
              aria-label={`Messages${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Mail className="h-4 w-4 text-gray-800" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </Button>
          </Link>
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


