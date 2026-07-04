"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  Check,
  Crown,
  Home,
  Palette,
  PawPrint,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import type { PetInventoryItem, PetItemRarity } from "@/lib/api"

type ClosetCategory = "species" | "style" | "background" | "effect"

type ClosetCategoryConfig = {
  key: ClosetCategory
  label: string
  icon: LucideIcon
}

const CLOSET_CATEGORIES: ClosetCategoryConfig[] = [
  { key: "species", label: "Mascotes", icon: PawPrint },
  { key: "style", label: "Visual", icon: Shirt },
  { key: "background", label: "Cenários", icon: Home },
  { key: "effect", label: "Efeitos", icon: Sparkles },
]

const RARITY_LABELS: Record<PetItemRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
}

const ACQUISITION_LABELS: Record<string, string> = {
  shop: "Loja",
  drop: "Drop",
  admin: "Presente",
  reward: "Recompensa",
}

export function closetCategoryOf(item: PetInventoryItem): ClosetCategory {
  if (item.type === "species" || item.type === "skin") return "species"
  if (item.type === "background" || item.attachmentSlot === "background")
    return "background"
  if (item.type === "effect" || item.attachmentSlot === "effect")
    return "effect"
  return "style"
}

function assetIsRenderable(assetUrl?: string | null) {
  return Boolean(assetUrl?.startsWith("/"))
}

function rarityLabel(rarity?: PetItemRarity) {
  return rarity ? RARITY_LABELS[rarity] : "Cosmético"
}

function acquisitionLabel(source?: PetInventoryItem["acquisitionSource"]) {
  if (!source) return null
  return ACQUISITION_LABELS[source] ?? source
}

function itemPreviewMode(item: PetInventoryItem) {
  const category = closetCategoryOf(item)
  return category === "background" ? "cover" : "contain"
}

function ItemPreview({ item }: { item: PetInventoryItem }) {
  const canRenderAsset = assetIsRenderable(item.assetUrl)
  const objectMode = itemPreviewMode(item)

  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-inner ring-1 ring-slate-200">
      {canRenderAsset ? (
        <Image
          src={item.assetUrl as string}
          alt={item.name}
          fill
          sizes="80px"
          className={
            objectMode === "cover" ? "object-cover" : "object-contain p-1"
          }
        />
      ) : (
        <span className="text-4xl">{item.emoji}</span>
      )}
    </div>
  )
}

interface PetClosetProps {
  items: PetInventoryItem[]
  onEquip: (item: PetInventoryItem) => void
}

export function PetCloset({ items, onEquip }: PetClosetProps) {
  const [activeCategory, setActiveCategory] =
    useState<ClosetCategory>("species")

  const counts = useMemo(() => {
    return CLOSET_CATEGORIES.reduce(
      (acc, category) => {
        acc[category.key] = items.filter(
          (item) => closetCategoryOf(item) === category.key,
        ).length
        return acc
      },
      {} as Record<ClosetCategory, number>,
    )
  }, [items])

  const activeItems = items.filter(
    (item) => closetCategoryOf(item) === activeCategory,
  )
  const activeConfig =
    CLOSET_CATEGORIES.find((category) => category.key === activeCategory) ??
    CLOSET_CATEGORIES[0]
  const equippedCount = items.filter((item) => item.equipped).length

  return (
    <div className="rounded-2xl bg-card p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">
            Armário
          </p>
          <p className="text-lg font-black text-foreground">
            {equippedCount} item(ns) em uso
          </p>
        </div>
        <div className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
          {items.length} total
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nenhum item ainda — visite a Loja do Pet!
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CLOSET_CATEGORIES.map((category) => {
              const Icon = category.icon
              const selected = activeCategory === category.key
              return (
                <button
                  key={category.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveCategory(category.key)}
                  className={`flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm font-black shadow-sm transition-all ${
                    selected
                      ? "bg-purple-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{category.label}</span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      selected ? "bg-white/20" : "bg-white"
                    }`}
                  >
                    {counts[category.key]}
                  </span>
                </button>
              )
            })}
          </div>

          {activeItems.length === 0 ? (
            <p className="rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm font-semibold text-muted-foreground">
              Nenhum item em {activeConfig.label.toLowerCase()} ainda.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeItems.map((item) => {
                const source = acquisitionLabel(item.acquisitionSource)
                return (
                  <article
                    key={
                      item.inventoryItemId ??
                      item.petItemId ??
                      item.shopItemId ??
                      item.name
                    }
                    className={`rounded-2xl border-2 p-3 transition-all ${
                      item.equipped
                        ? "border-purple-300 bg-purple-50 shadow-md"
                        : "border-border bg-muted/40"
                    }`}
                  >
                    <div className="flex gap-3">
                      <ItemPreview item={item} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-black text-foreground">
                              {item.name}
                            </p>
                            <p className="text-xs font-semibold text-muted-foreground">
                              {rarityLabel(item.rarity)}
                            </p>
                          </div>
                          {item.equipped ? (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-purple-500 px-2 py-1 text-[11px] font-black text-white">
                              <Check className="h-3 w-3" />
                              Equipado
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {item.isPremium ? (
                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-700">
                              <Crown className="h-3 w-3" />
                              Premium
                            </span>
                          ) : null}
                          {source ? (
                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500">
                              {source}
                            </span>
                          ) : null}
                          {item.quantity > 1 ? (
                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500">
                              x{item.quantity}
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => onEquip(item)}
                          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black shadow transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                            item.equipped
                              ? "bg-white text-purple-700 ring-1 ring-purple-200"
                              : "bg-purple-500 text-white"
                          }`}
                        >
                          {item.equipped ? (
                            <>
                              <Palette className="h-4 w-4" />
                              Guardar
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Equipar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
