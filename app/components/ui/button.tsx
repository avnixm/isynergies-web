import * as React from "react"
import { cn } from "@/app/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            'default': "bg-gradient-to-r from-[#0D1E66] to-[#1A3A8A] text-white hover:from-[#1A3A8A] hover:to-[#0D1E66] shadow",
            'destructive': "bg-red-500 text-white hover:bg-red-600",
            'outline': "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
            'secondary': "bg-gray-100 text-gray-900 hover:bg-gray-200",
            'ghost': "hover:bg-gray-100 text-gray-700",
            'link': "text-blue-600 underline-offset-4 hover:underline",
          }[variant],
          {
            'default': "h-10 px-4 py-2",
            'sm': "h-9 rounded-md px-3",
            'lg': "h-11 rounded-md px-8",
            'icon': "h-10 w-10",
          }[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

