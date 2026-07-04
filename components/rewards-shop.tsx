"use client"

import { useState } from "react"
import { Lock, Unlock, ShoppingBag, Star } from "lucide-react"
import type { Reward } from "@/lib/api"

interface RewardsShopProps {
  stars: number
  rewards: Reward[]
  onRedeem: (rewardId: string) => void
}

export function RewardsShop({ stars, rewards, onRedeem }: RewardsShopProps) {
  const [selectedReward, setSelectedReward] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Recompensa mais barata define a mensagem de "quanto falta" no cabeçalho
  const cheapestCost =
    rewards.length > 0 ? Math.min(...rewards.map((r) => r.cost)) : 0
  const canRedeemAny = rewards.some((r) => stars >= r.cost)

  const handleRewardSelect = (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId)
    if (reward && stars >= reward.cost) {
      setSelectedReward(rewardId)
      setShowConfirmation(true)
    }
  }

  const handleConfirmRedeem = () => {
    if (selectedReward) {
      onRedeem(selectedReward)
    }
    setShowConfirmation(false)
    setSelectedReward(null)
  }

  return (
    <div className="space-y-4">
      {/* Shop Header */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-accent to-orange-400 p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <ShoppingBag className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">
              Loja de Recompensas
            </p>
            <p className="text-xl font-bold text-white">
              {rewards.length === 0
                ? "Loja vazia"
                : canRedeemAny
                  ? "Você pode resgatar!"
                  : `Junte ${cheapestCost} estrelas`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2">
          <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
          <span className="text-xl font-bold text-white">{stars}</span>
        </div>
      </div>

      {/* Status Banner */}
      {!canRedeemAny && rewards.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4 shadow-md">
          <Lock className="h-6 w-6 text-muted-foreground" />
          <p className="font-semibold text-secondary-foreground">
            Faltam{" "}
            <span className="text-primary">
              {cheapestCost - stars} estrela
              {cheapestCost - stars !== 1 ? "s" : ""}
            </span>{" "}
            para desbloquear a primeira recompensa!
          </p>
        </div>
      )}

      {/* Rewards Grid - Use rewards from props */}
      <div className="grid grid-cols-2 gap-3">
        {rewards.length === 0 && (
          <div className="col-span-2 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-6 text-center">
            <p className="font-semibold text-muted-foreground">
              Nenhuma recompensa cadastrada.
            </p>
          </div>
        )}
        {rewards.map((reward) => {
          const canRedeem = stars >= reward.cost
          return (
            <button
              key={reward.id}
              onClick={() => handleRewardSelect(reward.id)}
              disabled={!canRedeem}
              className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 ${
                canRedeem
                  ? "bg-card shadow-lg hover:scale-[1.03] hover:shadow-xl active:scale-[0.97]"
                  : "bg-muted/50 opacity-60"
              }`}
            >
              {/* Lock/Unlock indicator */}
              <div
                className={`absolute right-2 top-2 rounded-full p-1.5 ${
                  canRedeem ? "bg-primary/10" : "bg-muted-foreground/10"
                }`}
              >
                {canRedeem ? (
                  <Unlock className="h-4 w-4 text-primary" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Emoji */}
              <div
                className={`mb-3 flex h-16 w-16 items-center justify-center rounded-xl transition-all ${
                  canRedeem
                    ? "bg-gradient-to-br from-accent/20 to-orange-200 group-hover:scale-110"
                    : "bg-muted"
                }`}
              >
                <span className="text-4xl">{reward.emoji}</span>
              </div>

              {/* Label - Use reward.title instead of reward.label */}
              <p
                className={`font-bold ${canRedeem ? "text-foreground" : "text-muted-foreground"}`}
              >
                {reward.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {reward.description}
              </p>

              {/* Cost indicator - Use reward.cost */}
              <div
                className={`mt-3 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
                  canRedeem
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Star className="h-3 w-3 fill-current" />
                {reward.cost} estrelas
              </div>
            </button>
          )
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <div className="animate-pop-in w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-orange-200">
                <span className="text-5xl">
                  {rewards.find((r) => r.id === selectedReward)?.emoji}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Resgatar Recompensa?
              </h3>
              <p className="mt-2 text-muted-foreground">
                {rewards.find((r) => r.id === selectedReward)?.title}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1 text-amber-600">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-bold">
                  -{rewards.find((r) => r.id === selectedReward)?.cost ?? 10}{" "}
                  estrelas
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 rounded-xl bg-secondary py-3 font-bold text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRedeem}
                className="flex-1 rounded-xl bg-primary py-3 font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
              >
                Resgatar!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
