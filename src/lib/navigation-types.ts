// Это решает проблему несовместимых типов NavTab, MobileTab, ChatTab, NavigationTab

/**
 * Единый тип навигационных табов для всего приложения
 * Заменяет: NavTab, MobileTab, ChatTab, NavigationTab, MobileNavTab
 */
export type AppTab = "chat" | "canvas" | "games" | "users" | "settings"

/**
 * Информация о навигационном элементе
 */
export interface NavItem {
  id: AppTab
  label: string
  labelEn: string
  icon: string
  color: string
  gradient?: string
  ariaLabel: string
}

/**
 * Конфигурация навигации - единый источник правды
 */
export const NAV_ITEMS: NavItem[] = [
  {
    id: "chat",
    label: "Чат",
    labelEn: "Chat",
    icon: "MessageCircle",
    color: "var(--accent-primary)",
    gradient: "from-violet-500 to-purple-600",
    ariaLabel: "Открыть чат",
  },
  {
    id: "canvas",
    label: "Холст",
    labelEn: "Canvas",
    icon: "PenTool",
    color: "var(--success)",
    gradient: "from-emerald-500 to-teal-600",
    ariaLabel: "Открыть холст",
  },
  {
    id: "games",
    label: "Игры",
    labelEn: "Games",
    icon: "Gamepad2",
    color: "var(--accent-games)",
    gradient: "from-blue-500 to-indigo-600",
    ariaLabel: "Открыть игры",
  },
  {
    id: "users",
    label: "Люди",
    labelEn: "People",
    icon: "Users",
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-600",
    ariaLabel: "Показать участников",
  },
  {
    id: "settings",
    label: "Ещё",
    labelEn: "More",
    icon: "Settings",
    color: "var(--accent-primary)",
    gradient: "from-violet-500 to-purple-600",
    ariaLabel: "Открыть настройки",
  },
]

/**
 * Получить основные табы (без settings - для основной навигации)
 */
export const getMainTabs = () => NAV_ITEMS.filter((item) => item.id !== "settings")

/**
 * Получить табы для контента комнаты (chat, canvas, games)
 */
export const getRoomTabs = () => NAV_ITEMS.filter((item) => ["chat", "canvas", "games"].includes(item.id))

/**
 * Получить таб по ID
 */
export const getTabById = (id: AppTab) => NAV_ITEMS.find((item) => item.id === id)
