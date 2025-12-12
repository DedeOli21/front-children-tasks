"use client"

import { useState } from "react"
import { Lock, Check, Sparkles } from "lucide-react"

export interface AvatarItem {
  id: string
  name: string
  emoji: string
  type: "hat" | "accessory" | "background" | "outfit"
  cost: number
  owned: boolean
  equipped: boolean
}

interface AvatarShopProps {
  stars: number
  items: AvatarItem[]
  onPurchase: (itemId: string, cost: number) => void
  onEquip: (itemId: string) => void
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  hat: "Chapeus",
  accessory: "Acessorios",
  background: "Fundos",
  outfit: "Roupas",
}

export function AvatarShop({ stars, items, onPurchase, onEquip }: AvatarShopProps) {
  const [selectedType, setSelectedType] = useState<string>("hat")
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null)

  const filteredItems = items.filter((item) => item.type === selectedType)
  const equippedItems = items.filter((item) => item.equipped)

  const handlePurchase = (item: AvatarItem) => {
    if (stars < item.cost || item.owned) return
    setPurchaseAnimation(item.id)
    onPurchase(item.id, item.cost)
    setTimeout(() => setPurchaseAnimation(null), 1000)
  }

  return (
    <div className="space-y-4">
      {/* Avatar Preview */}
      <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 p-1 shadow-xl">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-sky-100 to-indigo-100">
          {/* Background */}
          {equippedItems.find((i) => i.type === "background") && (
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
              {equippedItems.find((i) => i.type === "background")?.emoji}
            </div>
          )}

          {/* Avatar body */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Hat */}
            {equippedItems.find((i) => i.type === "hat") && (
              <span className="-mb-2 text-4xl">{equippedItems.find((i) => i.type === "hat")?.emoji}</span>
            )}

            {/* Face */}
            <span className="text-6xl">{equippedItems.find((i) => i.type === "outfit")?.emoji || "👦"}</span>

            {/* Accessory */}
            {equippedItems.find((i) => i.type === "accessory") && (
              <span className="-mt-2 text-3xl">{equippedItems.find((i) => i.type === "accessory")?.emoji}</span>
            )}
          </div>

          {/* Sparkle effect */}
          <Sparkles className="absolute right-2 top-2 h-5 w-5 animate-pulse text-yellow-400" />
        </div>
      </div>

      <p className="text-center text-sm font-semibold text-muted-foreground">Personalize seu avatar!</p>

      {/* Type tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {Object.entries(ITEM_TYPE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all ${
              selectedType === type ? "bg-purple-500 text-white shadow-md" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-3 gap-3">
        {filteredItems.map((item) => {
          const canAfford = stars >= item.cost
          const isAnimating = purchaseAnimation === item.id

          return (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-2xl border-2 p-3 transition-all duration-300 ${
                item.equipped
                  ? "border-purple-500 bg-purple-50 shadow-lg"
                  : item.owned
                    ? "border-emerald-400 bg-emerald-50"
                    : canAfford
                      ? "border-slate-200 bg-card hover:border-purple-300 hover:shadow-md"
                      : "border-slate-200 bg-slate-100 opacity-60"
              } ${isAnimating ? "animate-purchase" : ""}`}
            >
              {/* Equipped badge */}
              {item.equipped && (
                <div className="absolute -right-1 -top-1 rounded-bl-lg bg-purple-500 p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}

              {/* Item display */}
              <div className="mb-2 flex justify-center text-4xl">{item.emoji}</div>

              <p className="mb-1 text-center text-xs font-bold text-foreground">{item.name}</p>

              {/* Action button */}
              {item.owned ? (
                <button
                  onClick={() => onEquip(item.id)}
                  className={`w-full rounded-lg py-1.5 text-xs font-bold transition-colors ${
                    item.equipped ? "bg-purple-500 text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  {item.equipped ? "Equipado" : "Usar"}
                </button>
              ) : (
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={!canAfford}
                  className={`flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                    canAfford
                      ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500"
                      : "bg-slate-300 text-slate-500"
                  }`}
                >
                  {canAfford ? (
                    <>
                      <span>⭐</span>
                      <span>{item.cost}</span>
                    </>
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
