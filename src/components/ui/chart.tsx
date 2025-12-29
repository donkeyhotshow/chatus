"use client";

import * as React from "react"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
type ThemeKey = 'light' | 'dark';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const THEMES: Record<ThemeKey, string> = { light: "", dark: ".dark" }

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ReactNode
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

export const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  // Chart styles would be generated here based on id and config
  void id;
  void config;
  return null
}

export const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>((props, ref) => (
  <div ref={ref} {...props}>
    {props.children}
  </div>
))
ChartTooltip.displayName = "ChartTooltip"

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>((props, ref) => (
  <div ref={ref} {...props}>
    {props.children}
  </div>
))
ChartTooltipContent.displayName = "ChartTooltipContent"

export const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>((props, ref) => (
  <div ref={ref} {...props}>
    {props.children}
  </div>
))
ChartLegend.displayName = "ChartLegend"

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>((props, ref) => (
  <div ref={ref} {...props}>
    {props.children}
  </div>
))
ChartLegendContent.displayName = "ChartLegendContent"

export { useChart }
