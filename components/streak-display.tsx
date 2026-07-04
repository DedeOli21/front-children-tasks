"use client"

import { Flame, Snowflake } from "lucide-react"
import { useEffect, useState } from "react"

interface StreakDisplayProps {
  streak: number
  lastCompletedDate?: string
  // Recorde histórico e inventário de congelamentos (gamificação)
  longestStreak?: number
  freezes?: number
}

export function StreakDisplay({ streak, longestStreak = 0, freezes = 0 }: StreakDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (streak > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [streak])

  const isStreakActive = streak > 0
  const streakLevel = streak >= 7 ? "legendary" : streak >= 5 ? "epic" : streak >= 3 ? "hot" : "warming"

  const getStreakColor = () => {
    switch (streakLevel) {
      case "legendary":
        return "from-purple-500 via-pink-500 to-red-500"
      case "epic":
        return "from-orange-500 via-red-500 to-pink-500"
      case "hot":
        return "from-orange-400 via-orange-500 to-red-500"
      default:
        return "from-yellow-400 via-orange-400 to-orange-500"
    }
  }

  const getStreakMessage = () => {
    if (streak >= 7) return "LENDARIO! Voce e incrivel!"
    if (streak >= 5) return "EPICO! Continue assim!"
    if (streak >= 3) return "FOGO! Voce esta arrasando!"
    if (streak > 0) return "Esquentando! Mantenha o ritmo!"
    return "Complete todas as tarefas para acender o fogo!"
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 shadow-lg transition-all duration-500 ${
        isStreakActive ? `bg-gradient-to-r ${getStreakColor()}` : "bg-gradient-to-r from-slate-200 to-slate-300"
      }`}
    >
      {/* Animated fire particles */}
      {isStreakActive && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-up"
              style={{
                left: `${15 + i * 15}%`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0.6,
              }}
            >
              <Flame className="h-4 w-4 text-yellow-300" />
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${
              isStreakActive ? "bg-white/20 backdrop-blur-sm" : "bg-slate-400/30"
            } ${isAnimating ? "animate-pulse-scale" : ""}`}
          >
            {isStreakActive ? (
              <Flame
                className={`h-8 w-8 ${
                  streakLevel === "legendary"
                    ? "text-yellow-200"
                    : streakLevel === "epic"
                      ? "text-yellow-300"
                      : "text-white"
                } drop-shadow-lg`}
              />
            ) : (
              <Snowflake className="h-8 w-8 text-slate-500" />
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black ${isStreakActive ? "text-white" : "text-slate-600"}`}>
                {streak}
              </span>
              <span className={`text-sm font-bold ${isStreakActive ? "text-white/80" : "text-slate-500"}`}>
                {streak === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className={`text-xs font-semibold ${isStreakActive ? "text-white/90" : "text-slate-500"}`}>
              {getStreakMessage()}
            </p>
          </div>
        </div>

        {/* Streak badges */}
        {streak >= 3 && (
          <div className="flex items-center gap-1">
            {[...Array(Math.min(streak, 7))].map((_, i) => (
              <Flame
                key={i}
                className={`h-5 w-5 transition-all duration-300 ${
                  i < 3 ? "text-yellow-300" : i < 5 ? "text-orange-300" : "text-pink-300"
                } ${isAnimating && i === streak - 1 ? "animate-bounce" : ""}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recorde e congelamentos */}
      {(longestStreak > 0 || freezes > 0) && (
        <div className="relative z-10 mt-3 flex items-center gap-2">
          {longestStreak > 0 && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                isStreakActive ? "bg-white/20 text-white" : "bg-white/70 text-slate-600"
              }`}
            >
              🏆 Recorde: {longestStreak} {longestStreak === 1 ? "dia" : "dias"}
            </span>
          )}
          {freezes > 0 && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                isStreakActive ? "bg-white/20 text-white" : "bg-white/70 text-sky-600"
              }`}
              title="Proteções preservam sua sequência num dia difícil"
            >
              <Snowflake className="h-3 w-3" /> {freezes} proteção{freezes > 1 ? "ões" : ""}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
