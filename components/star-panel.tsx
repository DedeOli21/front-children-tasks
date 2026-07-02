"use client"

import { Star, Gift } from "lucide-react"
import { useEffect, useState } from "react"

interface StarPanelProps {
  stars: number
}

export function StarPanel({ stars }: StarPanelProps) {
  const [animateStars, setAnimateStars] = useState(false)
  const progress = Math.min(((stars % 10) / 10) * 100, 100)
  const starsToGo = 10 - (stars % 10)

  useEffect(() => {
    setAnimateStars(true)
    const timer = setTimeout(() => setAnimateStars(false), 500)
    return () => clearTimeout(timer)
  }, [stars])

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 p-6 shadow-xl">
      {/* Decorative elements */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-yellow-300/30" />
      <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-orange-300/30" />

      <div className="relative z-10">
        {/* Star Counter */}
        <div className="mb-4 flex items-center justify-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-2xl bg-white/90 px-6 py-3 shadow-lg backdrop-blur-sm ${
              animateStars ? "animate-bounce-star" : ""
            }`}
          >
            <Star className="h-10 w-10 fill-yellow-400 text-yellow-500 drop-shadow-md" />
            <span className="text-5xl font-black text-amber-600">{stars}</span>
          </div>
        </div>

        {/* Motivational text */}
        <p className="mb-4 text-center text-lg font-bold text-white drop-shadow-md">
          {stars >= 10
            ? "🎉 Você pode resgatar uma recompensa!"
            : `Faltam ${starsToGo} estrela${starsToGo > 1 ? "s" : ""} para resgatar!`}
        </p>

        {/* Progress Bar */}
        <div className="relative h-8 overflow-hidden rounded-full bg-white/40 shadow-inner">
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full bg-gradient-to-r from-emerald-400 to-primary pr-2 transition-all duration-700 ease-out"
            style={{ width: `${Math.max(progress, 5)}%` }}
          >
            {progress > 20 && <Star className="h-5 w-5 fill-white text-white" />}
          </div>

          {/* Progress markers */}
          <div className="absolute inset-0 flex items-center justify-between px-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  i < stars % 10 || (stars >= 10 && stars % 10 === 0 && i < 10) ? "bg-white shadow-md" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Target indicator */}
        <div className="mt-2 flex justify-between text-sm font-semibold text-white/80">
          <span>0</span>
          <span className="flex items-center gap-1">
            <Gift className="h-4 w-4" /> 10 estrelas = 1 recompensa
          </span>
          <span>10</span>
        </div>
      </div>
    </div>
  )
}
