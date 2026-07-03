"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Loader2,
  Droplets,
  Apple,
  Star,
  ShoppingBag,
  Shirt,
  Pencil,
  Check,
  X,
} from "lucide-react"
import {
  petApi,
  type VirtualPet,
  type PetShopItem,
  type PetInventoryItem,
  type ShopItemType,
} from "@/lib/api"

// Visual da planta por estágio (quando não há skin equipada)
const STAGE_EMOJI: Record<VirtualPet["stage"], string> = {
  seed: "🌰",
  sprout: "🌱",
  growing: "🪴",
  blooming: "🌸",
}

const STAGE_LABELS: Record<VirtualPet["stage"], string> = {
  seed: "Sementinha",
  sprout: "Brotinho",
  growing: "Crescendo!",
  blooming: "Floresceu! 🎉",
}

const MOOD_MESSAGES: Record<VirtualPet["mood"], string> = {
  happy: "Sua plantinha está feliz! 💚",
  thirsty: "Ela está com sede... dá uma aguinha? 💧",
  hungry: "Barriguinha roncando! Que tal um adubo? 🌰",
  sad: "Ela precisa de você! 🥺",
}

// Cenário por emoji do background equipado
function sceneClasses(background: VirtualPet["background"]): string {
  switch (background?.emoji) {
    case "🛏️":
      return "from-orange-100 via-amber-50 to-yellow-100"
    case "🏡":
      return "from-emerald-100 via-green-50 to-lime-100"
    case "🌌":
      return "from-indigo-900 via-purple-900 to-slate-900"
    default:
      return "from-sky-100 via-cyan-50 to-emerald-50"
  }
}

const TYPE_LABELS: Record<ShopItemType, string> = {
  water: "Água",
  food: "Comida",
  skin: "Espécies",
  background: "Cenários",
  effect: "Efeitos",
}

interface PetScreenProps {
  stars: number
  onStarsChange: (stars: number) => void
}

export function PetScreen({ stars, onStarsChange }: PetScreenProps) {
  const [pet, setPet] = useState<VirtualPet | null>(null)
  const [inventory, setInventory] = useState<PetInventoryItem[]>([])
  const [shop, setShop] = useState<PetShopItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<"pet" | "shop" | "closet">("pet")

  // Reações visuais
  const [careEmoji, setCareEmoji] = useState<string | null>(null)
  const [isReacting, setIsReacting] = useState(false)

  // Renomear
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState("")

  const load = useCallback(async () => {
    try {
      const [petData, inventoryData, shopData] = await Promise.all([
        petApi.get(),
        petApi.inventory().catch(() => [] as PetInventoryItem[]),
        petApi.shop().catch(() => [] as PetShopItem[]),
      ])
      setPet(petData)
      setInventory(inventoryData)
      setShop(shopData)
    } catch {
      toast.error("Não foi possível carregar sua plantinha.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const consumables = inventory.filter((i) => i.type === "water" || i.type === "food")
  const cosmetics = inventory.filter((i) => i.type !== "water" && i.type !== "food")

  const handleCare = async (item: PetInventoryItem) => {
    try {
      const result = await petApi.care(item.shopItemId)
      setPet((prev) =>
        prev
          ? {
              ...prev,
              waterLevel: result.waterLevel,
              nutritionLevel: result.nutritionLevel,
              xp: result.xp,
              stage: result.stage,
              mood: result.mood,
            }
          : prev,
      )
      setInventory((prev) =>
        prev
          .map((entry) =>
            entry.shopItemId === item.shopItemId ? { ...entry, quantity: result.remaining } : entry,
          )
          .filter((entry) => entry.quantity > 0),
      )
      // Planta reage: respingo + pulinho feliz
      setCareEmoji(item.type === "water" ? "💧" : "😋")
      setIsReacting(true)
      setTimeout(() => {
        setCareEmoji(null)
        setIsReacting(false)
      }, 900)
      toast.success(result.message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu certo, tente de novo")
    }
  }

  const handleBuy = async (item: PetShopItem) => {
    try {
      const result = await petApi.buy(item.id)
      onStarsChange(result.currentStars)
      toast.success(result.message)
      const fresh = await petApi.inventory().catch(() => inventory)
      setInventory(fresh)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível comprar")
    }
  }

  const handleEquip = async (item: PetInventoryItem) => {
    try {
      const result = await petApi.equip(item.shopItemId)
      toast.success(result.message)
      const [freshPet, freshInventory] = await Promise.all([petApi.get(), petApi.inventory()])
      setPet(freshPet)
      setInventory(freshInventory)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível equipar")
    }
  }

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await petApi.rename(newName)
      setPet((prev) => (prev ? { ...prev, name: result.name } : prev))
      setIsRenaming(false)
      toast.success(result.message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nome inválido")
    }
  }

  if (isLoading || !pet) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  const plantEmoji = pet.wilted ? "🥀" : (pet.skin?.emoji ?? STAGE_EMOJI[pet.stage])
  const isSpace = pet.background?.emoji === "🌌"

  return (
    <div className="space-y-4">
      {/* ============ A CENA ============ */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-b p-6 shadow-xl ${sceneClasses(pet.background)}`}
      >
        {/* Efeito equipado: bolhas de sabão ou vagalumes */}
        {pet.effect?.emoji === "🫧" && (
          <div className="pointer-events-none absolute inset-0">
            {[...Array(7)].map((_, i) => (
              <span
                key={i}
                className="animate-bubble-rise absolute bottom-6 text-2xl"
                style={{ left: `${10 + i * 12}%`, animationDelay: `${i * 0.6}s` }}
              >
                🫧
              </span>
            ))}
          </div>
        )}
        {pet.effect?.emoji === "✨" && (
          <div className="pointer-events-none absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="animate-firefly absolute text-lg"
                style={{ left: `${12 + i * 14}%`, top: `${20 + (i % 3) * 22}%`, animationDelay: `${i * 0.8}s` }}
              >
                ✨
              </span>
            ))}
          </div>
        )}

        {/* Nome da planta */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          {isRenaming ? (
            <form onSubmit={handleRename} className="flex items-center gap-1">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                minLength={2}
                maxLength={20}
                className="w-40 rounded-xl border-2 border-emerald-300 bg-white/90 px-3 py-1 text-center font-black text-slate-700 focus:outline-none"
              />
              <button type="submit" className="rounded-lg bg-emerald-500 p-1.5 text-white">
                <Check className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setIsRenaming(false)} className="rounded-lg bg-slate-300 p-1.5 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <>
              <h2 className={`text-xl font-black drop-shadow ${isSpace ? "text-white" : "text-slate-700"}`}>
                {pet.name}
              </h2>
              <button
                onClick={() => {
                  setNewName(pet.name)
                  setIsRenaming(true)
                }}
                className={`rounded-lg p-1 ${isSpace ? "text-white/70 hover:text-white" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        <p className={`relative z-10 text-center text-xs font-bold ${isSpace ? "text-white/70" : "text-slate-500"}`}>
          {STAGE_LABELS[pet.stage]} · {pet.xp} XP
        </p>

        {/* A planta */}
        <div className="relative z-10 flex h-44 items-end justify-center">
          {careEmoji && <span className="animate-care-splash absolute top-4 text-4xl">{careEmoji}</span>}
          <span
            className={`text-8xl drop-shadow-lg ${isReacting ? "animate-plant-happy" : "animate-plant-sway"}`}
            role="img"
            aria-label={`Plantinha ${STAGE_LABELS[pet.stage]}`}
          >
            {plantEmoji}
          </span>
        </div>

        {pet.wilted && (
          <p className="relative z-10 mt-1 text-center text-sm font-bold text-red-500">
            Ela murchou com a quebra da sequência... complete os combinados para replantar! 🌱
          </p>
        )}

        {/* Barras de sobrevivência */}
        <div className="relative z-10 mt-4 space-y-2">
          <LevelBar
            icon={<Droplets className="h-4 w-4 text-sky-500" />}
            label="Água"
            value={pet.waterLevel}
            barClass="bg-gradient-to-r from-sky-400 to-cyan-400"
            dark={isSpace}
          />
          <LevelBar
            icon={<Apple className="h-4 w-4 text-amber-600" />}
            label="Nutrição"
            value={pet.nutritionLevel}
            barClass="bg-gradient-to-r from-amber-400 to-orange-400"
            dark={isSpace}
          />
        </div>

        <p className={`relative z-10 mt-3 text-center text-sm font-semibold ${isSpace ? "text-white/80" : "text-slate-600"}`}>
          {MOOD_MESSAGES[pet.mood]}
        </p>
      </div>

      {/* ============ CUIDAR (consumíveis do inventário) ============ */}
      {consumables.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-lg">
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Cuidar da plantinha</p>
          <div className="flex flex-wrap gap-2">
            {consumables.map((item) => (
              <button
                key={item.shopItemId}
                onClick={() => handleCare(item)}
                className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 font-bold text-emerald-700 shadow transition-transform hover:scale-105 active:scale-95"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm">{item.name}</span>
                <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-black">×{item.quantity}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============ NAVEGAÇÃO LOJA/ARMÁRIO ============ */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setView(view === "shop" ? "pet" : "shop")}
          className={`flex items-center justify-center gap-2 rounded-2xl py-3 font-black shadow-lg transition-all ${
            view === "shop" ? "bg-emerald-500 text-white" : "bg-card text-foreground hover:scale-[1.02]"
          }`}
        >
          <ShoppingBag className="h-5 w-5" />
          Loja Botânica
        </button>
        <button
          onClick={() => setView(view === "closet" ? "pet" : "closet")}
          className={`flex items-center justify-center gap-2 rounded-2xl py-3 font-black shadow-lg transition-all ${
            view === "closet" ? "bg-purple-500 text-white" : "bg-card text-foreground hover:scale-[1.02]"
          }`}
        >
          <Shirt className="h-5 w-5" />
          Armário
        </button>
      </div>

      {/* ============ LOJA ============ */}
      {view === "shop" && (
        <div className="space-y-3">
          {(["water", "food", "skin", "background", "effect"] as ShopItemType[]).map((type) => {
            const items = shop.filter((item) => item.type === type)
            if (items.length === 0) return null
            return (
              <div key={type} className="rounded-2xl bg-card p-4 shadow-lg">
                <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">{TYPE_LABELS[type]}</p>
                <div className="space-y-2">
                  {items.map((item) => {
                    const owned = inventory.find((entry) => entry.shopItemId === item.id)
                    const isCosmetic = type !== "water" && type !== "food"
                    const alreadyOwned = isCosmetic && !!owned
                    const canAfford = stars >= item.price
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border-2 border-border bg-muted/40 p-3">
                        <span className="text-3xl">{item.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground">{item.name}</p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                          {item.restoreAmount > 0 && (
                            <p className="text-xs font-semibold text-emerald-600">Restaura {item.restoreAmount}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={alreadyOwned || !canAfford}
                          className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-sm font-black shadow transition-transform ${
                            alreadyOwned
                              ? "bg-slate-200 text-slate-400"
                              : canAfford
                                ? "bg-amber-400 text-white hover:scale-105"
                                : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {alreadyOwned ? (
                            "Já é seu!"
                          ) : (
                            <>
                              {item.price} <Star className="h-4 w-4 fill-yellow-100 text-yellow-100" />
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ============ ARMÁRIO (cosméticos) ============ */}
      {view === "closet" && (
        <div className="rounded-2xl bg-card p-4 shadow-lg">
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Seus itens</p>
          {cosmetics.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum item ainda — visite a Loja Botânica! 🛍️
            </p>
          ) : (
            <div className="space-y-2">
              {cosmetics.map((item) => (
                <div key={item.shopItemId} className="flex items-center gap-3 rounded-xl border-2 border-border bg-muted/40 p-3">
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{TYPE_LABELS[item.type]}</p>
                  </div>
                  <button
                    onClick={() => handleEquip(item)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-sm font-black shadow transition-transform hover:scale-105 ${
                      item.equipped ? "bg-purple-500 text-white" : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {item.equipped ? "Equipado ✓" : "Equipar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LevelBar({
  icon,
  label,
  value,
  barClass,
  dark,
}: {
  icon: React.ReactNode
  label: string
  value: number
  barClass: string
  dark: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className={`w-16 text-xs font-bold ${dark ? "text-white/80" : "text-slate-600"}`}>{label}</span>
      <div className={`h-4 flex-1 overflow-hidden rounded-full ${dark ? "bg-white/20" : "bg-white/70"}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${barClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`w-8 text-right text-xs font-black ${dark ? "text-white" : "text-slate-600"}`}>{value}</span>
    </div>
  )
}
