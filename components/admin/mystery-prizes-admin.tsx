"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, X, Check, Package } from "lucide-react"
import { mysteryBoxApi, type MysteryPrize } from "@/lib/api"

interface MysteryPrizesAdminProps {
  prizes: MysteryPrize[]
  onCreate: (prize: Omit<MysteryPrize, "id">) => void
  onUpdate: (id: string, prize: Partial<MysteryPrize>) => void
  onDelete: (id: string) => void
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
  epic: "Épico",
  legendary: "Lendário",
}

export function MysteryPrizesAdmin({ prizes, onCreate, onUpdate, onDelete }: MysteryPrizesAdminProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    emoji: "",
    rarity: "common" as MysteryPrize["rarity"],
    description: "",
    weight: 50,
  })

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.emoji.trim() || !formData.description.trim()) return

    if (editingId) {
      onUpdate(editingId, formData)
      setEditingId(null)
    } else {
      onCreate(formData)
      setIsAdding(false)
    }
    setFormData({ name: "", emoji: "", rarity: "common", description: "", weight: 50 })
  }

  const startEdit = (prize: MysteryPrize) => {
    setEditingId(prize.id)
    setFormData({
      name: prize.name,
      emoji: prize.emoji,
      rarity: prize.rarity,
      description: prize.description,
      weight: prize.weight || 50,
    })
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ name: "", emoji: "", rarity: "common", description: "", weight: 50 })
  }

  // Calcular probabilidade aproximada baseada no peso
  const calculateProbability = (prizeWeight: number) => {
    const totalWeight = prizes.reduce((sum, p) => sum + (p.weight || 1), 0)
    if (totalWeight === 0) return 0
    return ((prizeWeight / totalWeight) * 100).toFixed(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Prêmios da Caixa Surpresa</h2>
          <p className="text-sm text-slate-500">Configure os prêmios e seus pesos de probabilidade</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-2 font-bold text-white shadow-md transition-all hover:from-pink-600 hover:to-orange-600"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {/* Info sobre pesos */}
      <div className="rounded-2xl bg-blue-50 p-4 border-2 border-blue-200">
        <p className="text-sm font-semibold text-blue-800 mb-2">💡 Como funcionam os pesos?</p>
        <p className="text-xs text-blue-700">
          O <strong>peso</strong> determina a probabilidade de ganhar cada prêmio. Quanto maior o peso, maior a chance.
          <br />
          <strong>Exemplo:</strong> Um prêmio com peso 50 tem 5x mais chance que um com peso 10.
        </p>
      </div>

      {(isAdding || editingId) && (
        <div className="rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-orange-50 p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Emoji</label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="Ex: 🎬"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-2xl focus:border-pink-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Raridade</label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value as MysteryPrize["rarity"] })}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 focus:border-pink-400 focus:outline-none"
                >
                  <option value="common">Comum</option>
                  <option value="rare">Raro</option>
                  <option value="epic">Épico</option>
                  <option value="legendary">Lendário</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">Nome do Prêmio</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Filme especial"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 focus:border-pink-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">Descrição</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Assistir filme fora de hora!"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 focus:border-pink-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">
                Peso (Probabilidade) - Quanto maior, mais fácil de ganhar
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number.parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 focus:border-pink-400 focus:outline-none"
                />
                {prizes.length > 0 && (
                  <div className="whitespace-nowrap text-sm text-slate-600">
                    <span className="font-bold text-pink-600">
                      ~{calculateProbability(formData.weight)}% de chance
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Sugestões: Comum (50-100), Raro (20-40), Épico (5-15), Lendário (1-5)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 py-3 font-bold text-white transition-all hover:from-pink-600 hover:to-orange-600"
              >
                <Check className="h-4 w-4" />
                {editingId ? "Salvar" : "Adicionar"}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center rounded-xl bg-slate-200 px-4 py-3 font-bold text-slate-600 transition-all hover:bg-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {prizes.map((prize) => {
          const probability = calculateProbability(prize.weight || 1)
          return (
            <div
              key={prize.id}
              className={`flex items-center justify-between rounded-2xl border-2 bg-gradient-to-r ${RARITY_COLORS[prize.rarity]} p-4 shadow-sm`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{prize.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{prize.name}</span>
                    <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs font-bold text-white">
                      {RARITY_LABELS[prize.rarity]}
                    </span>
                    <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs font-bold text-white">
                      Peso: {prize.weight || 1}
                    </span>
                    <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs font-bold text-white">
                      ~{probability}%
                    </span>
                  </div>
                  <p className="text-sm text-white/90">{prize.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(prize)}
                  className="rounded-xl bg-white/20 p-2 text-white transition-all hover:bg-white/30"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(prize.id)}
                  className="rounded-xl bg-white/20 p-2 text-white transition-all hover:bg-white/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
        {prizes.length === 0 && (
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">Nenhum prêmio cadastrado ainda</p>
            <p className="mt-1 text-sm text-slate-400">Clique em "Adicionar" para criar o primeiro prêmio</p>
          </div>
        )}
      </div>
    </div>
  )
}

