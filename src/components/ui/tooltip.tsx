"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

/**
 * TooltipProvider with optimized delay settings
 * P3 Fix: Мгновенное исчезновение tooltip при уводе курсора
 */
const TooltipProvider = ({ children, ...props }: TooltipPrimitive.TooltipProviderProps) => (
  <TooltipPrimitive.Provider
    delayDuration={300}
    skipDelayDuration={0}
    {...props}
  >
    {children}
  </TooltipPrimitive.Provider>
)

/**
 * Tooltip with zero close delay for instant hide
 * P3 Fix: Tooltips не исчезают сразу - исправлено
 */
const Tooltip = ({ children, ...props }: TooltipPrimitive.TooltipProps) => (
  <TooltipPrimitive.Root
    {...props}
  >
    {children}
  </TooltipPrimitive.Root>
)

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
      // Быстрая анимация появления
      "animate-in fade-in-0 zoom-in-95 duration-150",
      // Мгновенное исчезновение без задержки
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-100",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
