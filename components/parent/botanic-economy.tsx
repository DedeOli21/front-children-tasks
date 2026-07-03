"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Sprout, Trash2, X } from "lucide-react"
import { petApi, type PetShopItem, type ShopItemType } from "@/lib/api"

const TYPE_LABELS: Record<ShopItemType, string> = {
  water: "💧 Água",
  food: "🌰 Comida",
  skin: "🌵 Espécie",
  background: "🏡 Cenário",
  effect: "🫧 Efeito",
}

// Economia Botânica: o responsável gerencia os itens e preços da loja da planta
export function BotanicEconomy() {
  const [items, setItems] = useState<PetShopItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    petApi
      .shop()
      .then(setItems)
      .catch(() => toast.error("Não foi possível carregar a loja"))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleRemove = async (item: PetShopItem) => {
    try {
      await petApi.removeShopItem(item.id)
      toast.success(`"${item.name}" removido da loja`)
      setItems((prev) => prev.filter((entry) => entry.id !== item.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  const standard = items.filter((item) => item.familyId === null)
  const custom = items.filter((item) => item.familyId !== null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
          <Sprout className="h-6 w-6 text-emerald-500" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-emerald-700">Economia Botânica</p>
          <p className="text-sm text-emerald-600/80">
            Itens que a criança compra com estrelas para cuidar e decorar a plantinha
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-white shadow transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Novo item
        </button>
      </div>

      {/* Itens da família (editáveis) */}
      <div className="rounded-2xl bg-white p-4 shadow-lg">
        <p className="mb-2 text-xs font-bold uppercase text-slate-400">Itens da sua família</p>
        {custom.length === 0 ? (
          <p className="py-3 text-center text-sm text-slate-400">
            Nenhum item próprio ainda — crie itens especiais com preços da sua economia.
          </p>
        ) : (
          <div className="space-y-2">
            {custom.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <span className="text-2xl">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-400">
                    {TYPE_LABELS[item.type]} · {item.price}⭐
                    {item.restoreAmount > 0 ? ` · restaura ${item.restoreAmount}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(item)}
                  className="shrink-0 rounded-xl bg-red-50 p-2 text-red-400 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catálogo padrão (somente leitura) */}
      <div className="rounded-2xl bg-white p-4 shadow-lg">
        <p className="mb-2 text-xs font-bold uppercase text-slate-400">Catálogo padrão (fixo)</p>
        <div className="grid gap-1 sm:grid-cols-2">
          {standard.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-xl">{item.emoji}</span>
              <span className="flex-1 truncate text-sm font-semibold text-slate-600">{item.name}</span>
              <span className="text-xs font-black text-amber-600">{item.price}⭐</span>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <CreateItemModal
          onClose={() => setShowForm(false)}
          onCreated={(item) => {
            setItems((prev) => [...prev, item])
            setShowForm(false)
            toast.success(`"${item.name}" adicionado à loja!`)
          }}
        />
      )}
    </div>
  )
}

function CreateItemModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (item: PetShopItem) => void
}) {
  const [type, setType] = useState<ShopItemType>("water")
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("🌱")
  const [price, setPrice] = useState(5)
  const [restoreAmount, setRestoreAmount] = useState(30)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const isConsumable = type === "water" || type === "food"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSaving(true)
    try {
      const created = await petApi.createShopItem({
        type,
        name,
        emoji,
        price,
        restoreAmount: isConsumable ? restoreAmount : undefined,
      })
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar item")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-700">Novo item da loja</h2>
          <button onClick={onClose} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-3 text-center text-sm font-semibold text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-5 gap-1">
            {(Object.keys(TYPE_LABELS) as ShopItemType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`rounded-xl border-2 px-1 py-2 text-[11px] font-bold ${
                  type === option
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {TYPE_LABELS[option]}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-16 rounded-xl border-2 border-slate-200 bg-slate-50 px-2 py-3 text-center text-xl focus:border-emerald-400 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Nome do item"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <label className="text-xs font-bold uppercase text-slate-400">
            Preço (estrelas)
            <input
              type="number"
              min={1}
              max={500}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
              className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none"
            />
          </label>

          {isConsumable && (
            <label className="text-xs font-bold uppercase text-slate-400">
              Quanto restaura (1–100)
              <input
                type="number"
                min={1}
                max={100}
                value={restoreAmount}
                onChange={(e) => setRestoreAmount(Number(e.target.value))}
                required
                className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-black text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            Adicionar à loja
          </button>
        </form>
      </div>
    </div>
  )
}
