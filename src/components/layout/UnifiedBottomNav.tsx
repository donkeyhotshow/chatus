"use client"

import { memo, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, PenTool, Gamepad2, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppTab } from "@/lib/navigation-types"
import { MobileMenuDrawer } from "../mobile/MobileMenuDrawer"

interface UnifiedBottomNavProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  unreadCount?: number
  userName?: string
  userAvatar?: string
  onSettings?: () => void
  onLogout?: () => void
  onProfile?: () => void
  className?: string
}

const navItems = [
  { id: "chat" as const, label: "Чат", icon: MessageCircle, color: "var(--accent-primary)" },
  { id: "canvas" as const, label: "Холст", icon: PenTool, color: "var(--success)" },
  { id: "games" as const, label: "Игры", icon: Gamepad2, color: "var(--accent-games)" },
  { id: "users" as const, label: "Люди", icon: Users, color: "#EC4899" },
  { id: "settings" as const, label: "Ещё", icon: Settings, color: "var(--accent-primary)" },
]

export const UnifiedBottomNav = memo(function UnifiedBottomNav({
  activeTab,
  onTabChange,
  unreadCount = 0,
  userName,
  userAvatar,
  onSettings,
  onLogout,
  onProfile,
  className,
}: UnifiedBottomNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleTabClick = useCallback(
    (tabId: AppTab) => {
      if ("vibrate" in navigator) {
        navigator.vibrate(5)
      }

      if (tabId === "settings") {
        setIsMenuOpen(true)
      } else {
        onTabChange(tabId)
      }
    },
    [onTabChange],
  )

  return (
    <>
      <MobileMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSettings={onSettings}
        onLogout={onLogout}
        onProfile={onProfile}
        userName={userName}
        userAvatar={userAvatar}
      />

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-nav",
          "bg-black/80 backdrop-blur-xl border-t border-white/10",
          "shadow-[0_-10px_40px_rgba(0,0,0,0.5)]",
          className,
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="navigation"
        aria-label="Основная навигация"
      >
        <div className="flex items-center justify-around h-[56px] px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === "settings" && isMenuOpen)
            const showBadge = item.id === "chat" && unreadCount > 0

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5",
                  "transition-all duration-300 ease-out",
                  "min-w-14 min-h-14 touch-target",
                  "[-webkit-tap-highlight-color:transparent]",
                  isActive ? "text-white" : "text-white/40",
                  "hover:text-white/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute top-0 w-8 h-[2px] rounded-full"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 12px ${item.color}80`,
                    }}
                  />
                )}

                <div
                  className={cn(
                    "relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300",
                    isActive && "bg-white/10",
                  )}
                >
                  <item.icon
                    className={cn("w-5 h-5 transition-all duration-300", isActive ? "scale-110" : "scale-100")}
                    style={
                      isActive
                        ? {
                            color: item.color,
                            filter: `drop-shadow(0 0 6px ${item.color}40)`,
                          }
                        : undefined
                    }
                  />

                  <AnimatePresence>
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg border border-black"
                        aria-live="polite"
                        aria-label={`${unreadCount} непрочитанных сообщений`}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-tight transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-60",
                  )}
                  style={isActive ? { color: item.color } : undefined}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
})

export type { AppTab as NavTab }
