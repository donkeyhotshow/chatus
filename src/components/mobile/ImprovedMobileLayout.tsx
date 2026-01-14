"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Search, MoreVertical } from "lucide-react"
import type { UserProfile } from "@/lib/types"
import { useIsMobile } from "@/hooks/use-mobile"
import { ChatArea } from "../chat/ChatArea"
import type { AppTab } from "@/lib/navigation-types"
import { UnifiedBottomNav } from "../layout/UnifiedBottomNav"
import { LoadingSpinner } from "@/components/ui/LoadingStates"

const CollaborationSpace = lazy(() =>
  import("../chat/CollaborationSpace").then((m) => ({ default: m.CollaborationSpace })),
)

interface ImprovedMobileLayoutProps {
  user: UserProfile
  roomId: string
  otherUser?: UserProfile
  allUsers: UserProfile[]
  onBack?: () => void
}

export function ImprovedMobileLayout({ user, roomId, otherUser, allUsers, onBack }: ImprovedMobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<AppTab>("chat")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return
    const handleResize = () => {
      const isKeyboard = window.visualViewport!.height < window.innerHeight * 0.85
      setIsKeyboardOpen(isKeyboard)
    }
    window.visualViewport.addEventListener("resize", handleResize)
    return () => window.visualViewport?.removeEventListener("resize", handleResize)
  }, [])

  const triggerHaptic = (type: "light" | "medium" | "heavy" = "light") => {
    if ("vibrate" in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30,
      }
      navigator.vibrate(patterns[type])
    }
  }

  const handleTabChange = (tab: AppTab) => {
    if (tab === "more") return
    triggerHaptic("light")
    setActiveTab(tab)
    setIsSearchOpen(false)
  }

  const handleBack = () => {
    triggerHaptic("medium")
    if (activeTab !== "chat") {
      setActiveTab("chat")
    } else if (onBack) {
      onBack()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false)
        setSearchQuery("")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (!isMobile) {
    return null
  }

  return (
    <div className="flex flex-col h-screen-safe w-full overflow-hidden bg-black">
      {/* Mobile Header */}
      <header className="flex-shrink-0 min-h-[56px] bg-gradient-to-r from-neutral-950 to-black border-b border-white/10 flex items-center px-4 z-50">
        <AnimatePresence mode="wait">
          {isSearchOpen ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="flex items-center w-full gap-3"
            >
              <button
                onClick={() => {
                  setIsSearchOpen(false)
                  setSearchQuery("")
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Закрыть поиск"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <input
                type="text"
                placeholder="Поиск сообщений..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-neutral-800 text-white placeholder-neutral-400 px-4 py-2 rounded-lg border border-neutral-700 focus:border-violet-500 focus:outline-none min-h-[44px]"
                autoFocus
              />
            </motion.div>
          ) : (
            <motion.div
              key="header"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3 min-h-[44px]">
                {activeTab !== "chat" && (
                  <button
                    onClick={handleBack}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Назад"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                )}
                <div className="flex-1 overflow-hidden">
                  <h1 className="font-bold text-white text-lg truncate">
                    {activeTab === "chat" && "Чат"}
                    {activeTab === "canvas" && "Холст"}
                    {activeTab === "games" && "Игры"}
                    {activeTab === "users" && "Участники"}
                  </h1>
                  {activeTab === "chat" && otherUser && (
                    <p className="text-xs text-neutral-400 truncate">с {otherUser.name}</p>
                  )}
                  {activeTab === "users" && <p className="text-xs text-neutral-400">{allUsers.length} участников</p>}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeTab === "chat" && (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Поиск"
                  >
                    <Search className="w-5 h-5 text-white" />
                  </button>
                )}
                <button
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Дополнительно"
                >
                  <MoreVertical className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        <AnimatePresence initial={false}>
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex flex-col"
            >
              <ChatArea user={user} roomId={roomId} onMobileBack={handleBack} />
            </motion.div>
          )}

          {(activeTab === "canvas" || activeTab === "games" || activeTab === "users") && (
            <motion.div
              key="collab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex flex-col"
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <LoadingSpinner size="lg" />
                      <p className="text-sm text-neutral-400">Загрузка...</p>
                    </div>
                  </div>
                }
              >
                <CollaborationSpace
                  isVisible={true}
                  roomId={roomId}
                  user={user}
                  otherUser={otherUser}
                  allUsers={allUsers}
                  mobileActiveTab={activeTab}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      {!isKeyboardOpen && (
        <UnifiedBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}

      {/* Search Results Overlay */}
      <AnimatePresence>
        {isSearchOpen && searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm z-40 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-center text-neutral-400 mt-8">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Поиск по запросу "{searchQuery}"</p>
                <p className="text-sm mt-2">Функция поиска в разработке</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
