"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
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
  playWaterSound,
  playEatSound,
  playCoinSound,
  playBubbleSound,
} from "@/lib/sound"
import {
  petApi,
  type VirtualPet,
  type PetShopItem,
  type PetInventoryItem,
  type ShopItemType,
} from "@/lib/api"
import {
  VirtualPetStage,
  resolvePetSpecies,
  type PetSpeciesKey,
} from "@/components/pet/virtual-pet-stage"
import { PetCloset } from "@/components/pet/pet-closet"

const STAGE_LABELS: Record<VirtualPet["stage"], string> = {
  seed: "Começando",
  sprout: "Animado",
  growing: "Crescendo!",
  blooming: "Campeão!",
}

const MOOD_MESSAGES: Record<VirtualPet["mood"], string> = {
  happy: "Seu pet está feliz! 💚",
  thirsty: "Seu pet está com sede... dá uma aguinha? 💧",
  hungry: "Barriguinha roncando! Que tal um lanchinho? 🌰",
  sad: "Seu pet precisa de você! 🥺",
}

const TYPE_LABELS: Record<ShopItemType, string> = {
  water: "Água",
  food: "Comida",
  skin: "Legado",
  background: "Cenários",
  effect: "Efeitos",
}
const PET_SHOP_TYPES: ShopItemType[] = ["water", "food", "background", "effect"]

function inventoryKey(item: PetInventoryItem): string {
  return item.inventoryItemId ?? item.petItemId ?? item.shopItemId ?? item.name
}

function equipTargetId(item: PetInventoryItem): string | null {
  return item.inventoryItemId ?? item.petItemId ?? item.shopItemId ?? null
}

function petBackgroundKey(pet: VirtualPet): string {
  if (pet.equippedItems?.background) return pet.equippedItems.background
  if (pet.background?.emoji === "🏡") return "backyard"
  return "bedroom"
}

function petVisualStreak(pet: VirtualPet): number {
  if (pet.sick || pet.wilted || pet.animationState === "sad") return 0
  return Math.max(1, pet.level - 1)
}

function petSpeciesKey(pet: VirtualPet): PetSpeciesKey {
  return resolvePetSpecies(pet.equippedItems?.species ?? pet.modelKey)
}

interface PetScreenProps {
  stars: number
  onStarsChange: (stars: number) => void
  refreshKey?: number
}

export function PetScreen({
  stars,
  onStarsChange,
  refreshKey = 0,
}: PetScreenProps) {
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
      toast.error("Não foi possível carregar seu pet.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const consumables = inventory.filter(
    (i) => i.type === "water" || i.type === "food",
  )
  const cosmetics = inventory.filter(
    (i) => i.type !== "water" && i.type !== "food" && i.type !== "skin",
  )

  const handleCare = async (item: PetInventoryItem) => {
    if (!item.shopItemId) {
      toast.error("Esse item é cosmético e não pode ser usado para cuidar.")
      return
    }

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
            entry.shopItemId === item.shopItemId
              ? { ...entry, quantity: result.remaining }
              : entry,
          )
          .filter((entry) => entry.quantity > 0),
      )
      // Pet reage: som + respingo + pulinho feliz
      if (item.type === "water") playWaterSound()
      else playEatSound()
      setCareEmoji(item.type === "water" ? "💧" : "😋")
      setIsReacting(true)
      setTimeout(() => {
        setCareEmoji(null)
        setIsReacting(false)
      }, 900)
      toast.success(result.message)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não deu certo, tente de novo",
      )
    }
  }

  const handleBuy = async (item: PetShopItem) => {
    try {
      const result = await petApi.buy(item.id)
      playCoinSound()
      onStarsChange(result.currentStars)
      toast.success(result.message)
      const fresh = await petApi.inventory().catch(() => inventory)
      setInventory(fresh)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível comprar",
      )
    }
  }

  const handleEquip = async (item: PetInventoryItem) => {
    const targetId = equipTargetId(item)
    if (!targetId) {
      toast.error("Não foi possível identificar esse item.")
      return
    }

    try {
      const result = await petApi.equip(targetId)
      playBubbleSound()
      toast.success(result.message)
      const [freshPet, freshInventory] = await Promise.all([
        petApi.get(),
        petApi.inventory(),
      ])
      setPet(freshPet)
      setInventory(freshInventory)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível equipar",
      )
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

  const handleSpeciesChange = async (nextSpecies: PetSpeciesKey) => {
    if (species === nextSpecies) return

    try {
      const updated = await petApi.chooseSpecies(nextSpecies)
      setPet(updated)
      playBubbleSound()
      toast.success(updated.message ?? "Pet atualizado!")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível trocar o pet",
      )
    }
  }

  if (isLoading || !pet) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  const currentBackground = petBackgroundKey(pet)
  const visualStreak = petVisualStreak(pet)
  const species = petSpeciesKey(pet)
  const hasPremiumAttachment =
    pet.equippedAttachments?.some((item) => item.isPremium) ?? false

  return (
    <div className="space-y-4">
      <VirtualPetStage
        streak={visualStreak}
        isPremium={hasPremiumAttachment}
        isCelebrating={isReacting}
        isSick={pet.sick || pet.animationState === "sick"}
        currentBackground={currentBackground}
        species={species}
        effect={pet.equippedItems?.effect}
        petName={pet.name}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/85 px-3 py-2 shadow">
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
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 p-1.5 text-white"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="rounded-lg bg-slate-300 p-1.5 text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <>
                <h2 className="text-xl font-black text-slate-700 drop-shadow">
                  {pet.name}
                </h2>
                <button
                  onClick={() => {
                    setNewName(pet.name)
                    setIsRenaming(true)
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-500 shadow">
            Lv. {pet.level} · {STAGE_LABELS[pet.stage]} · {pet.xp} XP
          </p>
          {careEmoji ? (
            <span className="animate-care-splash text-4xl">{careEmoji}</span>
          ) : null}
        </div>
      </VirtualPetStage>

      <div className="grid grid-cols-2 gap-2">
        {[
          {
            key: "dog" as const,
            label: "Cachorro",
            image: "/assets/pet_avatar_icon.jpg",
          },
          {
            key: "cat" as const,
            label: "Gatinho",
            image: "/assets/cat_idle_happy.jpg",
          },
        ].map((option) => {
          const selected = species === option.key
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => handleSpeciesChange(option.key)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left shadow transition-transform hover:scale-[1.01] active:scale-[0.98] ${
                selected
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-border bg-card text-foreground"
              }`}
            >
              <Image
                src={option.image}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl object-cover"
              />
              <span className="font-black">{option.label}</span>
            </button>
          )
        })}
      </div>

      {pet.equippedAttachments?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {pet.equippedAttachments.map((item) => (
            <span
              key={item.inventoryItemId}
              className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-600 shadow-sm"
            >
              {item.emoji} {item.name}
            </span>
          ))}
        </div>
      )}

      {pet.sick ? (
        <div className="rounded-xl bg-red-50 p-3 text-center">
          <p className="text-sm font-bold text-red-500">
            Seu pet está tristinho! As tarefas de ontem ficaram
            incompletas...
          </p>
          <p className="text-xs font-semibold text-red-400">
            Complete todos os combinados de hoje para curá-la.
          </p>
        </div>
      ) : pet.wilted ? (
        <p className="text-center text-sm font-bold text-red-500">
          Ele sentiu a quebra da sequência. Complete os combinados para animar seu pet.
        </p>
      ) : null}

      <div className="rounded-2xl bg-card p-4 shadow-lg">
        <div className="space-y-2">
          <LevelBar
            icon={<Droplets className="h-4 w-4 text-sky-500" />}
            label="Água"
            value={pet.waterLevel}
            barClass="bg-gradient-to-r from-sky-400 to-cyan-400"
            dark={false}
          />
          <LevelBar
            icon={<Apple className="h-4 w-4 text-amber-600" />}
            label="Nutrição"
            value={pet.nutritionLevel}
            barClass="bg-gradient-to-r from-amber-400 to-orange-400"
            dark={false}
          />
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-slate-600">
          {MOOD_MESSAGES[pet.mood]}
        </p>
      </div>

      {/* ============ CUIDAR (consumíveis do inventário) ============ */}
      {consumables.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-lg">
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
            Cuidar do pet
          </p>
          <div className="flex flex-wrap gap-2">
            {consumables.map((item) => (
              <button
                key={inventoryKey(item)}
                onClick={() => handleCare(item)}
                className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 font-bold text-emerald-700 shadow transition-transform hover:scale-105 active:scale-95"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm">{item.name}</span>
                <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-black">
                  ×{item.quantity}
                </span>
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
            view === "shop"
              ? "bg-emerald-500 text-white"
              : "bg-card text-foreground hover:scale-[1.02]"
          }`}
        >
          <ShoppingBag className="h-5 w-5" />
          Loja do Pet
        </button>
        <button
          onClick={() => setView(view === "closet" ? "pet" : "closet")}
          className={`flex items-center justify-center gap-2 rounded-2xl py-3 font-black shadow-lg transition-all ${
            view === "closet"
              ? "bg-purple-500 text-white"
              : "bg-card text-foreground hover:scale-[1.02]"
          }`}
        >
          <Shirt className="h-5 w-5" />
          Armário
        </button>
      </div>

      {/* ============ LOJA ============ */}
      {view === "shop" && (
        <div className="space-y-3">
          {PET_SHOP_TYPES.map((type) => {
            const items = shop.filter((item) => item.type === type)
            if (items.length === 0) return null
            return (
              <div key={type} className="rounded-2xl bg-card p-4 shadow-lg">
                <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                  {TYPE_LABELS[type]}
                </p>
                <div className="space-y-2">
                  {items.map((item) => {
                    const owned = inventory.find(
                      (entry) => entry.shopItemId === item.id,
                    )
                    const isCosmetic = type !== "water" && type !== "food"
                    const alreadyOwned = isCosmetic && !!owned
                    const canAfford = stars >= item.price
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border-2 border-border bg-muted/40 p-3"
                      >
                        <span className="text-3xl">{item.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                          {item.restoreAmount > 0 && (
                            <p className="text-xs font-semibold text-emerald-600">
                              Restaura {item.restoreAmount}
                            </p>
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
                              {item.price}{" "}
                              <Star className="h-4 w-4 fill-yellow-100 text-yellow-100" />
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
        <PetCloset items={cosmetics} onEquip={handleEquip} />
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
      <span
        className={`w-16 text-xs font-bold ${dark ? "text-white/80" : "text-slate-600"}`}
      >
        {label}
      </span>
      <div
        className={`h-4 flex-1 overflow-hidden rounded-full ${dark ? "bg-white/20" : "bg-white/70"}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${barClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span
        className={`w-8 text-right text-xs font-black ${dark ? "text-white" : "text-slate-600"}`}
      >
        {value}
      </span>
    </div>
  )
}
