"use client"

import { memo, useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import {
  MessageCircle,
  PenTool,
  Gamepad2,
  Users,
  Settings as SettingsIcon,
  Home,
  Settings,
  LogOut,
  Snowflake,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "../icons/logo"
import { SnowEffect } from "../effects/SnowEffect"
import { NAV_ITEMS } from "@/lib/navigation-types"
import type { AppTab } from "@/lib/navigation-types"

export type UnifiedNavTab = AppTab

interface UnifiedDesktopNavigationProps {
  activeTab: UnifiedNavTab
  onTabChange: (tab: UnifiedNavTab) => void
  onLogout: () => void
  onSettings: () => void
  className?: string
  collapsible?: boolean
  defaultExpanded?: boolean
}

const navItems = NAV_ITEMS.filter(item => item.id !== 'settings')

const globalItems = NAV_ITEMS.filter(item => item.id === 'chat')

const iconMap = {
  MessageCircle,
  PenTool,
  Gamepad2,
  Users,
  Settings: SettingsIcon,
  Home,
} as const

const SIDEBAR_WIDTH_EXPANDED = 240
const SIDEBAR_WIDTH_COLLAPSED = 72

export const UnifiedDesktopNavigation = memo(function UnifiedDesktopNavigation({
  activeTab,
  onTabChange,
  onLogout,
  onSettings,
  className,
  collapsible = true,
  defaultExpanded = true,
}: UnifiedDesktopNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("desktop-nav-expanded")
      return saved !== null ? saved === "true" : defaultExpanded
    }
    return defaultExpanded
  })

  const [snowEnabled, setSnowEnabled] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("desktop-nav-expanded", isExpanded.toString())
    }
  }, [isExpanded])

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  return (
    <>
      <SnowEffect enabled={snowEnabled} />
      <aside
        className={cn(
          "flex flex-col h-full bg-black/95 border-r border-white/[0.06]",
          "transition-[width] duration-200 ease-linear z-40 relative",
          className,
        )}
        style={{ width: isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED }}
      >
        {collapsible && (
          <button
            onClick={toggleSidebar}
            className={cn(
              "absolute -right-3 top-20 z-50",
              "w-6 h-12 rounded-r-xl",
              "bg-black border border-l-0 border-white/10",
              "flex items-center justify-center",
              "text-white/40 hover:text-white hover:bg-white/5",
              "transition-all duration-200 group/toggle",
              "shadow-[4px_0_12px_rgba(0,0,0,0.5)]",
            )}
            title={isExpanded ? "Свернуть" : "Развернуть"}
            aria-label={isExpanded ? "Свернуть боковую панель" : "Развернуть боковую панель"}
          >
            <div className="absolute inset-y-2 left-0 w-[1px] bg-white/5 group-hover/toggle:bg-white/20 transition-colors" />
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4 transition-transform group-hover/toggle:-translate-x-0.5" />
            ) : (
              <ChevronRight className="w-4 h-4 transition-transform group-hover/toggle:translate-x-0.5" />
            )}
          </button>
        )}

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
              <Logo className="w-5 h-5 text-white" />
            </div>
            <span
              className={cn(
                "font-semibold text-white whitespace-nowrap transition-all duration-300 overflow-hidden",
                isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0",
              )}
            >
              ChatUs
            </span>
          </div>

          {isExpanded && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const isNeon = !document.documentElement.classList.contains("neon-mode")
                  document.documentElement.classList.toggle("neon-mode", isNeon)
                  if (typeof window !== "undefined") {
                    localStorage.setItem("neon-mode", isNeon ? "true" : "false")
                  }
                }}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 touch-target shrink-0",
                  "text-violet-400 hover:bg-violet-500/10",
                )}
                title="Neon режим"
                aria-label="Переключить Neon режим"
              >
                <Zap className="w-5 h-5 animate-pulse" />
              </button>
              <button
                onClick={() => setSnowEnabled(!snowEnabled)}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 touch-target shrink-0",
                  snowEnabled
                    ? "bg-sky-500/20 text-sky-400"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]",
                )}
                title={snowEnabled ? "Выключить снег" : "Включить снег"}
                aria-label={snowEnabled ? "Выключить снег" : "Включить снег"}
              >
                <Snowflake
                  className={cn("w-5 h-5", snowEnabled && "animate-spin")}
                  style={snowEnabled ? { animationDuration: "3s" } : undefined}
                />
              </button>
            </div>
          )}
        </div>

        <nav className="px-3 py-6 space-y-2 overflow-hidden border-b border-white/10">
          <div className="px-4 py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
            {isExpanded ? "Основное" : "•••"}
          </div>
          {navItems.map((item) => (
            (() => {
              const Icon = iconMap[item.icon as keyof typeof iconMap] ?? MessageCircle
              return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 touch-target group relative",
                activeTab === item.id
                  ? "bg-white/10 text-white shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500",
                  activeTab === item.id
                    ? "bg-gradient-to-br from-white/10 to-white/5 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]"
                    : "bg-white/[0.02] group-hover:bg-white/[0.06]",
                  activeTab === item.id && "ring-1 ring-white/20",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all duration-500 group-hover:scale-110",
                    activeTab === item.id ? item.color : "text-white/30 group-hover:text-white/60",
                    activeTab === item.id && "drop-shadow-[0_0_8px_currentColor]",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-300 overflow-hidden",
                  isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0",
                )}
              >
                {item.label}
              </span>
              {activeTab === item.id && isExpanded && (
                <motion.div
                  layoutId="nav-active-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.8)]"
                />
              )}
            </button>
              )
            })()
          ))}
        </nav>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
            {isExpanded ? "Глобальное" : "•••"}
          </div>
          {globalItems.map((item, index) => (
            (() => {
              const Icon = iconMap[item.icon as keyof typeof iconMap] ?? MessageCircle
              return (
            <button
              key={`${item.id}-${index}`}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 touch-target group",
                activeTab === item.id
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/[0.06]",
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] group-hover:bg-white/[0.08] flex items-center justify-center shrink-0 transition-colors">
                <Icon className="w-5 h-5 text-white/40 group-hover:text-white/70" />
              </div>
              <span
                className={cn(
                  "text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden",
                  isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0",
                )}
              >
                {item.label}
              </span>
            </button>
              )
            })()
          ))}
        </nav>

        <div className="px-3 py-4 space-y-1.5 border-t border-white/[0.06]">
          {!isExpanded && (
            <button
              onClick={() => setSnowEnabled(!snowEnabled)}
              className={cn(
                "w-full flex items-center justify-center px-3 py-3 rounded-xl transition-all duration-200 touch-target",
                snowEnabled ? "bg-sky-500/20 text-sky-400" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]",
              )}
              title={snowEnabled ? "Выключить снег" : "Включить снег"}
              aria-label={snowEnabled ? "Выключить снег" : "Включить снег"}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <Snowflake
                  className={cn("w-5 h-5", snowEnabled && "animate-spin")}
                  style={snowEnabled ? { animationDuration: "3s" } : undefined}
                />
              </div>
            </button>
          )}

          <button
            onClick={onSettings}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-200 touch-target group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center shrink-0 transition-colors">
              <Settings className="w-5 h-5" />
            </div>
            <span
              className={cn(
                "text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden",
                isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0",
              )}
            >
              Настройки
            </span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 touch-target group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-red-500/10 flex items-center justify-center shrink-0 transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <span
              className={cn(
                "text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden",
                isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0",
              )}
            >
              Выйти
            </span>
          </button>
        </div>
      </aside>
    </>
  )
})

UnifiedDesktopNavigation.displayName = "UnifiedDesktopNavigation"
