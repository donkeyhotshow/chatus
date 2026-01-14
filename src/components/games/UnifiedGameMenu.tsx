"use client"

import type React from "react"

import { memo, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gamepad2,
  X,
  HandMetal,
  Zap,
  Car,
  Bug,
  Search,
  Trophy,
  Users,
  Clock,
  Star,
  Crown,
  Sword,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { GameType } from "@/lib/types"
import { PremiumCard } from "../ui/premium-card"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"

export interface GameMetadata {
  id: GameType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: "strategy" | "action" | "arcade" | "casual"
  difficulty: "easy" | "medium" | "hard"
  players: "solo" | "2player" | "multiplayer"
  duration: "quick" | "medium" | "long"
  controls: {
    desktop: string[]
    mobile: "tap" | "dpad" | "joystick" | "buttons"
  }
  color: string
  gradient: string
  features: string[]
}

export const GAME_CATALOG: GameMetadata[] = [
  {
    id: "tic-tac-toe",
    name: "Крестики-нолики",
    description: "Классическая стратегическая игра",
    icon: X,
    category: "strategy",
    difficulty: "easy",
    players: "2player",
    duration: "quick",
    controls: {
      desktop: ["Mouse Click", "Keyboard 1-9"],
      mobile: "tap",
    },
    color: "#7C3AED",
    gradient: "from-violet-600 to-purple-700",
    features: ["AI Opponent", "Turn-based", "Multiplayer"],
  },
  {
    id: "rock-paper-scissors",
    name: "Камень-ножницы-бумага",
    description: "Кто победит?",
    icon: HandMetal,
    category: "casual",
    difficulty: "easy",
    players: "2player",
    duration: "quick",
    controls: {
      desktop: ["Mouse Click"],
      mobile: "buttons",
    },
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-600",
    features: ["AI Opponent", "Fast-paced", "Multiplayer"],
  },
  {
    id: "snake",
    name: "Змейка",
    description: "Классический аркадный геймплей",
    icon: Bug,
    category: "arcade",
    difficulty: "medium",
    players: "solo",
    duration: "medium",
    controls: {
      desktop: ["Arrow Keys", "WASD"],
      mobile: "dpad",
    },
    color: "#10B981",
    gradient: "from-emerald-500 to-green-600",
    features: ["Endless", "High Score", "Power-ups"],
  },
  {
    id: "car-race",
    name: "Гонки",
    description: "Гонка с физикой и дрифтом",
    icon: Car,
    category: "action",
    difficulty: "hard",
    players: "multiplayer",
    duration: "medium",
    controls: {
      desktop: ["Arrow Keys", "WASD", "Shift (Turbo)"],
      mobile: "joystick",
    },
    color: "#3B82F6",
    gradient: "from-blue-500 to-indigo-600",
    features: ["Physics", "Multiple Tracks", "AI Bots", "Turbo/Drift"],
  },
  {
    id: "vibe-jet",
    name: "Vibe Jet",
    description: "Бесконечный раннер с препятствиями",
    icon: Zap,
    category: "arcade",
    difficulty: "medium",
    players: "solo",
    duration: "quick",
    controls: {
      desktop: ["Space"],
      mobile: "tap",
    },
    color: "#8B5CF6",
    gradient: "from-purple-500 to-violet-600",
    features: ["Endless", "Progressive Difficulty", "3D Graphics"],
  },
  {
    id: "dice-roll",
    name: "Кості",
    description: "Просто кидай кості та перемагай",
    icon: Trophy,
    category: "casual",
    difficulty: "easy",
    players: "multiplayer",
    duration: "quick",
    controls: {
      desktop: ["Mouse Click"],
      mobile: "tap",
    },
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-600",
    features: ["Turn-based", "Multiplayer", "Random Luck"],
  },
  {
    id: "click-war",
    name: "Клікова Війна",
    description: "Гра на швидкість кліків та стратегію",
    icon: Zap,
    category: "action",
    difficulty: "medium",
    players: "2player",
    duration: "quick",
    controls: {
      desktop: ["Left Click", "Right Click"],
      mobile: "buttons",
    },
    color: "#DC2626",
    gradient: "from-red-500 to-rose-600",
    features: ["Fast-paced", "Strategy", "Power-ups"],
  },
  {
    id: "tower-defense",
    name: "Захист Вежі",
    description: "Тактична гра в жанрі Tower Defense",
    icon: Shield,
    category: "strategy",
    difficulty: "hard",
    players: "solo",
    duration: "long",
    controls: {
      desktop: ["Mouse Click", "WASD"],
      mobile: "tap",
    },
    color: "#0284C7",
    gradient: "from-violet-500 to-purple-600",
    features: ["Tower Building", "Wave System", "Upgrades"],
  },
]

interface UnifiedGameMenuProps {
  onSelectGame: (gameId: GameType) => void
  onClose: () => void
  className?: string
}

export const UnifiedGameMenu = memo(function UnifiedGameMenu({
  onSelectGame,
  onClose,
  className,
}: UnifiedGameMenuProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "difficulty" | "rating">("name")

  const categories = useMemo(
    () => [
      { id: "all", label: "Все", icon: Gamepad2 },
      { id: "strategy", label: "Стратегия", icon: Crown },
      { id: "action", label: "Экшн", icon: Sword },
      { id: "arcade", label: "Аркада", icon: Trophy },
      { id: "casual", label: "Казуальные", icon: Star },
    ],
    [],
  )

  const difficulties = useMemo(
    () => [
      { id: "all", label: "Все" },
      { id: "easy", label: "Легко", color: "text-green-400" },
      { id: "medium", label: "Средне", color: "text-yellow-400" },
      { id: "hard", label: "Сложно", color: "text-red-400" },
    ],
    [],
  )

  const filteredGames = useMemo(() => {
    return GAME_CATALOG.filter((game) => {
      const matchesSearch =
        searchQuery === "" ||
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = filterCategory === "all" || game.category === filterCategory

      const matchesDifficulty = filterDifficulty === "all" || game.difficulty === filterDifficulty

      return matchesSearch && matchesCategory && matchesDifficulty
    })
  }, [searchQuery, filterCategory, filterDifficulty])

  const sortedGames = useMemo(() => {
    const sorted = [...filteredGames]
    switch (sortBy) {
      case "difficulty":
        return sorted.sort((a, b) => {
          const diffOrder = { easy: 0, medium: 1, hard: 2 }
          return diffOrder[a.difficulty] - diffOrder[b.difficulty]
        })
      case "rating":
        return sorted.reverse() // Most popular first
      case "name":
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
    }
  }, [filteredGames, sortBy])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-50 bg-black/95 backdrop-blur-xl",
        "flex items-center justify-center p-4",
        "safe-area-inset",
        className,
      )}
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-5xl max-h-[90vh] flex flex-col"
      >
        <PremiumCard variant="glass" glow className="flex-1 flex flex-col overflow-hidden">
          {/* Header with stats */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-6 h-6 text-violet-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Выберите игру</h2>
                <p className="text-xs text-white/50 mt-1">{filteredGames.length} доступных игр</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 md:p-6 space-y-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск игр..."
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      "flex items-center gap-1.5",
                      filterCategory === cat.id
                        ? "bg-violet-500 text-white"
                        : "bg-white/5 text-white/60 hover:bg-white/10",
                    )}
                  >
                    <cat.icon className="w-3 h-3" />
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {difficulties.map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => setFilterDifficulty(diff.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      filterDifficulty === diff.id
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/60 hover:bg-white/10",
                      diff.color,
                    )}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <span className="text-xs text-white/50 font-medium">Сортировка:</span>
                {(["name", "difficulty", "rating"] as const).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortBy(sort)}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium transition-all",
                      sortBy === sort
                        ? "bg-violet-500/20 text-violet-300"
                        : "bg-white/5 text-white/60 hover:bg-white/10",
                    )}
                  >
                    {sort === "name" ? "Название" : sort === "difficulty" ? "Сложность" : "Рейтинг"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Game Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {sortedGames.map((game) => (
                  <GameCard key={game.id} game={game} onSelect={() => onSelectGame(game.id)} />
                ))}
              </AnimatePresence>
            </div>

            {sortedGames.length === 0 && (
              <div className="text-center py-12">
                <Gamepad2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">Игры не найдены</p>
              </div>
            )}
          </div>
        </PremiumCard>
      </motion.div>
    </motion.div>
  )
})

const GameCard = memo(function GameCard({
  game,
  onSelect,
}: {
  game: GameMetadata
  onSelect: () => void
}) {
  const DifficultyIcon = game.difficulty === "easy" ? Shield : game.difficulty === "medium" ? Sword : Crown

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <button
        onClick={onSelect}
        className={cn(
          "w-full text-left p-4 rounded-xl",
          "bg-gradient-to-br border border-white/10",
          "hover:border-white/20 transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
          game.gradient,
        )}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-black/30 backdrop-blur-sm">
            <game.icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm mb-1 truncate">{game.name}</h3>
            <p className="text-xs text-white/70 line-clamp-2">{game.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-black/30 border-white/10">
            <Users className="w-2.5 h-2.5 mr-1" />
            {game.players === "solo" ? "1P" : game.players === "2player" ? "2P" : "MP"}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-black/30 border-white/10">
            <Clock className="w-2.5 h-2.5 mr-1" />
            {game.duration === "quick" ? "2-5мин" : game.duration === "medium" ? "5-15мин" : "15+мин"}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-black/30 border-white/10">
            <DifficultyIcon className="w-2.5 h-2.5 mr-1" />
            {game.difficulty === "easy" ? "Легко" : game.difficulty === "medium" ? "Средне" : "Сложно"}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          {game.features.slice(0, 3).map((feature) => (
            <span key={feature} className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-medium">
              {feature}
            </span>
          ))}
        </div>
      </button>
    </motion.div>
  )
})
