"use client"

import { useState } from "react"
import { Gift, Sparkles, Star, X } from "lucide-react"

export interface MysteryPrize {
  id: string
  name: string
  emoji: string
  rarity: "common" | "rare" | "epic" | "legendary"
  description: string
}

interface MysteryBoxProps {
  stars: number
  cost: number
  prizes: MysteryPrize[]
  onOpen: (cost: number) => Promise<MysteryPrize>
}

const RARITY_COLORS = {
  common: "from-slate-400 to-slate-500",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 via-yellow-400 to-orange-400",
}

const RARITY_LABELS = {
  common: "Comum",
  rare: "Raro",
  epic: "Epico",
  legendary: "Lendario",
}

export function MysteryBox({ stars, cost, prizes, onOpen }: MysteryBoxProps) {
  const [isOpening, setIsOpening] = useState(false)
  const [wonPrize, setWonPrize] = useState<MysteryPrize | null>(null)
  const [showResult, setShowResult] = useState(false)

  const canAfford = stars >= cost

  const handleOpen = async () => {
    if (!canAfford || isOpening) return

    setIsOpening(true)
    setWonPrize(null)
    setShowResult(false)

    // Animate box opening
    setTimeout(async () => {
      try {
        const prize = await onOpen(cost)
        setWonPrize(prize)
        setShowResult(true)
      } catch (error) {
        console.error("Erro ao abrir caixa:", error)
      } finally {
        setIsOpening(false)
      }
    }, 2000)
  }

  const closeResult = () => {
    setShowResult(false)
    setWonPrize(null)
  }

  return (
    <div className="space-y-4">
      {/* Mystery Box Display */}
      <div className="relative mx-auto w-full max-w-xs">
        <div
          className={`relative mx-auto h-48 w-48 cursor-pointer transition-transform duration-300 ${
            isOpening ? "animate-shake" : canAfford ? "hover:scale-105" : "opacity-60"
          }`}
          onClick={handleOpen}
        >
          {/* Box glow effect */}
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-50 blur-xl" />

          {/* Box body */}
          <div className="relative flex h-full w-full flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 shadow-2xl">
            {/* Question marks floating */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="absolute animate-float-random text-2xl text-white/30"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + (i % 3) * 30}%`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                >
                  ?
                </span>
              ))}
            </div>

            {/* Main icon */}
            <Gift
              className={`relative z-10 h-20 w-20 text-white drop-shadow-lg ${isOpening ? "animate-bounce" : ""}`}
            />

            {/* Sparkles */}
            <Sparkles className="absolute right-4 top-4 h-6 w-6 animate-pulse text-yellow-300" />
            <Sparkles className="absolute bottom-4 left-4 h-5 w-5 animate-pulse text-yellow-300" />

            {/* Label */}
            <div className="relative z-10 mt-2 rounded-full bg-white/20 px-4 py-1 backdrop-blur-sm">
              <span className="font-black text-white">CAIXA SURPRESA</span>
            </div>
          </div>
        </div>

        {/* Cost badge */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleOpen}
            disabled={!canAfford || isOpening}
            className={`flex items-center gap-2 rounded-full px-6 py-3 font-bold shadow-lg transition-all ${
              canAfford && !isOpening
                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:scale-105 hover:shadow-xl"
                : "bg-slate-300 text-slate-500"
            }`}
          >
            <Star className="h-5 w-5 fill-current" />
            <span>{cost} Estrelas</span>
            {isOpening && <span className="ml-2 animate-spin">...</span>}
          </button>
        </div>

        {!canAfford && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Voce precisa de mais {cost - stars} estrela{cost - stars > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Possible prizes preview */}
      <div className="rounded-2xl bg-card p-4 shadow-md">
        <h3 className="mb-3 text-center text-sm font-bold text-muted-foreground">Possiveis Premios</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {prizes.slice(0, 6).map((prize) => (
            <div
              key={prize.id}
              className={`flex items-center gap-1 rounded-full bg-gradient-to-r ${RARITY_COLORS[prize.rarity]} px-3 py-1`}
            >
              <span className="text-lg">{prize.emoji}</span>
              <span className="text-xs font-semibold text-white">{prize.name}</span>
            </div>
          ))}
          {prizes.length > 6 && (
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
              +{prizes.length - 6} mais
            </span>
          )}
        </div>
      </div>

      {/* Prize Result Modal */}
      {showResult && wonPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm animate-scale-in overflow-hidden rounded-3xl bg-card shadow-2xl">
            {/* Close button */}
            <button
              onClick={closeResult}
              className="absolute right-3 top-3 z-10 rounded-full bg-slate-200 p-1.5 transition-colors hover:bg-slate-300"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>

            {/* Rarity banner */}
            <div className={`bg-gradient-to-r ${RARITY_COLORS[wonPrize.rarity]} py-3 text-center`}>
              <span className="font-black uppercase tracking-wider text-white">{RARITY_LABELS[wonPrize.rarity]}!</span>
            </div>

            {/* Prize content */}
            <div className="p-6 text-center">
              {/* Confetti effect for rare+ */}
              {(wonPrize.rarity === "epic" || wonPrize.rarity === "legendary") && (
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-confetti-fall"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        backgroundColor: ["#FFD700", "#FF69B4", "#00CED1", "#9370DB"][Math.floor(Math.random() * 4)],
                        width: "8px",
                        height: "8px",
                        borderRadius: "2px",
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="relative z-10">
                <span className="mb-4 block text-8xl">{wonPrize.emoji}</span>
                <h2 className="mb-2 text-2xl font-black text-foreground">{wonPrize.name}</h2>
                <p className="mb-6 text-muted-foreground">{wonPrize.description}</p>

                <button
                  onClick={closeResult}
                  className={`w-full rounded-xl bg-gradient-to-r ${RARITY_COLORS[wonPrize.rarity]} py-3 font-bold text-white shadow-lg transition-transform hover:scale-105`}
                >
                  Incrivel!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
