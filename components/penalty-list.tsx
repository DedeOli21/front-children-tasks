"use client"

import { useState } from "react"
import { AlertTriangle, Minus } from "lucide-react"
import type { Penalty } from "@/lib/api"

interface PenaltyListProps {
  penalties: Penalty[]
  onPenalty: (penaltyId: string, amount: number) => void
}

export function PenaltyList({ penalties, onPenalty }: PenaltyListProps) {
  const [animatingPenalty, setAnimatingPenalty] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  const handlePenaltyClick = (penaltyId: string) => {
    setShowConfirm(penaltyId)
  }

  const confirmPenalty = (penaltyId: string, amount: number) => {
    setAnimatingPenalty(penaltyId)
    setTimeout(() => {
      onPenalty(penaltyId, amount)
      setAnimatingPenalty(null)
      setShowConfirm(null)
    }, 300)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-red-700">Opa! Algo deu errado?</p>
          <p className="text-sm text-red-600/80">Toque abaixo para registrar</p>
        </div>
      </div>

      {/* Penalty Cards - Use penalties from props */}
      <div className="grid gap-3">
        {penalties.map((penalty) => {
          const isAnimating = animatingPenalty === penalty.id
          const isConfirming = showConfirm === penalty.id

          return (
            <div key={penalty.id} className="relative">
              <button
                onClick={() => handlePenaltyClick(penalty.id)}
                className={`group relative w-full overflow-hidden rounded-2xl bg-card p-4 text-left shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${
                  isAnimating ? "animate-shake bg-red-100" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 transition-all group-hover:border-red-300 group-hover:bg-red-100">
                    <span className="text-3xl">{penalty.emoji}</span>
                  </div>

                  {/* Label - Use penalty.title instead of penalty.label */}
                  <div className="flex-1">
                    <p className="text-lg font-bold text-foreground">{penalty.title}</p>
                    <p className="text-sm font-medium text-red-500">
                      -{penalty.amount} {penalty.amount === 1 ? "estrela" : "estrelas"}
                    </p>
                  </div>

                  {/* Minus indicator */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 shadow-md transition-all group-hover:bg-red-200">
                    <Minus className="h-5 w-5 text-red-500" strokeWidth={3} />
                  </div>
                </div>
              </button>

              {/* Confirmation overlay */}
              {isConfirming && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="flex flex-col items-center gap-3 p-4">
                    <p className="text-center font-bold text-white">Confirmar?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowConfirm(null)}
                        className="rounded-xl bg-gray-200 px-5 py-2 font-bold text-gray-700 transition-all hover:bg-gray-300 active:scale-95"
                      >
                        Não
                      </button>
                      <button
                        onClick={() => confirmPenalty(penalty.id, penalty.amount)}
                        className="rounded-xl bg-red-500 px-5 py-2 font-bold text-white transition-all hover:bg-red-600 active:scale-95"
                      >
                        Sim
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info message */}
      <div className="rounded-xl bg-amber-50 p-4 text-center">
        <p className="text-sm text-amber-700">
          <strong>Dica:</strong> Converse com Gabriel sobre o que aconteceu antes de aplicar
        </p>
      </div>
    </div>
  )
}
