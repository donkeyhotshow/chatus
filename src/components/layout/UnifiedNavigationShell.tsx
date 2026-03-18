"use client"

import { memo, type ReactNode } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { UnifiedBottomNav } from "../layout/UnifiedBottomNav"
import { cn } from "@/lib/utils"
import type { AppTab } from "@/lib/navigation-types"

interface UnifiedNavigationShellProps {
  children: ReactNode
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  unreadCount?: number
  userName?: string
  userAvatar?: string
  onSettings?: () => void
  onLogout?: () => void
  onProfile?: () => void
  showMobileNav?: boolean
  className?: string
}

export const UnifiedNavigationShell = memo(function UnifiedNavigationShell({
  children,
  activeTab,
  onTabChange,
  unreadCount,
  userName,
  userAvatar,
  onSettings,
  onLogout,
  onProfile,
  showMobileNav = true,
  className,
}: UnifiedNavigationShellProps) {
  const isMobile = useIsMobile()

  return (
    <div
      className={cn("relative w-full h-full min-h-screen flex flex-col", className)}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: isMobile && showMobileNav ? "calc(64px + env(safe-area-inset-bottom, 0px))" : "0px",
      }}
    >
      <main className="flex-1 overflow-hidden">{children}</main>

      {isMobile && showMobileNav && (
        <UnifiedBottomNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          unreadCount={unreadCount}
          userName={userName}
          userAvatar={userAvatar}
          onSettings={onSettings}
          onLogout={onLogout}
          onProfile={onProfile}
        />
      )}
    </div>
  )
})
