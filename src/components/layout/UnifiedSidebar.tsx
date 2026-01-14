"use client"

import { memo, useState } from "react"
import { Settings, LogOut, Snowflake, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "../icons/logo"
import { SnowEffect } from "../effects/SnowEffect"
import { NAV_ITEMS } from "@/lib/navigation-types"
import type { AppTab } from "@/lib/navigation-types"

interface UnifiedSidebarProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  onLogout?: () => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  className?: string
}

const navItems = NAV_ITEMS.filter(item => item.id !== 'settings')

export const UnifiedSidebar = memo(function UnifiedSidebar({
  activeTab,
  onTabChange,
  onLogout,
  expanded,
  onExpandedChange,
  className,
}: UnifiedSidebarProps) {
  const [snowEnabled, setSnowEnabled] = useState(false)

  return (
    <>
      <SnowEffect enabled={snowEnabled} />
      <aside
        onMouseEnter={() => onExpandedChange(true)}
        onMouseLeave={() => onExpandedChange(false)}
        className={cn(
          "flex flex-col h-full bg-black border-r border-white/10 transition-all duration-200 z-40",
          expanded ? "w-[var(--sidebar-width-expanded)]" : "w-[var(--sidebar-width)]",
          className,
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Logo className="w-7 h-7 text-[var(--text-primary)] shrink-0" />
            {expanded && (
              <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap animate-fade-in">ChatUs</span>
            )}
          </div>
          {/* Snow Toggle Button */}
          <button
            onClick={() => setSnowEnabled(!snowEnabled)}
            className={cn(
              "p-2 rounded-lg transition-all duration-200 touch-target",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
              snowEnabled
                ? "bg-sky-500/20 text-sky-400"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
            )}
            title={snowEnabled ? "Выключить снег" : "Включить снег"}
            aria-label={snowEnabled ? "Выключить снег" : "Включить снег"}
          >
            <Snowflake
              className={cn("w-5 h-5 shrink-0", snowEnabled && "animate-spin")}
              style={{ animationDuration: "3s" }}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
          {navItems.map((item) => {
            return (
              <button
                key={item.id}
                onClick={() => (window.location.href = "/")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 touch-target",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                  "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {expanded && (
                  <span className="text-sm font-medium whitespace-nowrap animate-fade-in">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-2 py-4 space-y-1 border-t border-white/10">
          <button
            onClick={() => onTabChange("settings")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 touch-target",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
              activeTab === "settings"
                ? "bg-[var(--accent-light)] text-[var(--accent-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {expanded && <span className="text-sm font-medium whitespace-nowrap animate-fade-in">Настройки</span>}
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 touch-target",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                "text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-red-50 dark:hover:bg-red-950/20",
              )}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {expanded && <span className="text-sm font-medium whitespace-nowrap animate-fade-in">Выйти</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  )
})
