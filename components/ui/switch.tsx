"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        // Checked state: primary color
        "data-[state=checked]:bg-primary data-[state=checked]:border-transparent",
        // Unchecked state: neutral gray with subtle border for visibility
        "data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-400",
        // Focus states
        "focus-visible:border-ring focus-visible:ring-ring/50",
        // Dark mode
        "dark:data-[state=unchecked]:bg-gray-600",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full ring-0 transition-transform",
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
          // Thumb colors
          "data-[state=checked]:bg-background",
          "data-[state=unchecked]:bg-white shadow-sm",
          // Dark mode
          "dark:data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-primary-foreground"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
