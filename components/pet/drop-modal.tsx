"use client"

import { useCallback, useEffect } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PetItemRarity } from "@/lib/api"

export type DropItemType = "food" | "water" | "freeze" | "cosmetic"

export interface DropModalProps {
  open: boolean
  itemType: DropItemType
  itemName?: string
  itemImageSrc?: string | null
  previewEmoji?: string
  rarity?: PetItemRarity
  bonusLabel?: string
  canEquip?: boolean
  isEquipping?: boolean
  onEquip?: () => void
  onClose: () => void
}

type DropItemLike = {
  key?: string
  name?: string
  attachmentKey?: string
  attachmentSlot?: string
}

const DROP_PRESENTATION: Record<
  DropItemType,
  {
    image: string
    title: string
    accent: string
    glow: string
  }
> = {
  food: {
    image: "/assets/food_bone.jpg",
    title: "Você encontrou um Osso Dourado!",
    accent: "from-amber-400 to-orange-500",
    glow: "bg-amber-300/65",
  },
  water: {
    image: "/assets/water_drop.jpg",
    title: "Você encontrou Água Mágica!",
    accent: "from-sky-400 to-cyan-500",
    glow: "bg-sky-300/65",
  },
  freeze: {
    image: "/assets/potion_freeze.jpg",
    title: "Você encontrou uma Poção de Proteção!",
    accent: "from-indigo-400 to-violet-500",
    glow: "bg-indigo-300/65",
  },
  cosmetic: {
    image: "/assets/celebration.jpg",
    title: "Você encontrou um item novo!",
    accent: "from-emerald-400 to-lime-500",
    glow: "bg-emerald-300/65",
  },
}

const RARITY_LABELS: Record<PetItemRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function inferDropItemType(item?: DropItemLike | null): DropItemType {
  if (!item) return "cosmetic"

  const text = normalize(
    [item.key, item.name, item.attachmentKey, item.attachmentSlot]
      .filter(Boolean)
      .join(" "),
  )

  if (/(freeze|potion|pocao|gelo|ice|shield|escudo)/.test(text)) return "freeze"
  if (/(food|bone|osso|comida|adubo|fertilizer)/.test(text)) return "food"
  if (/(agua|water|garrafa|bottle)/.test(text)) return "water"
  return "cosmetic"
}

function resolveImage(
  itemImageSrc: string | null | undefined,
  itemType: DropItemType,
) {
  if (itemImageSrc?.startsWith("/")) return itemImageSrc
  return DROP_PRESENTATION[itemType].image
}

export function DropModal({
  open,
  itemType,
  itemName,
  itemImageSrc,
  previewEmoji,
  rarity,
  bonusLabel,
  canEquip = false,
  isEquipping = false,
  onEquip,
  onClose,
}: DropModalProps) {
  const presentation = DROP_PRESENTATION[itemType]
  const imageSrc = resolveImage(itemImageSrc, itemType)
  const title = itemName ? `Você encontrou ${itemName}!` : presentation.title
  const showEquipAction = canEquip && Boolean(onEquip)

  const handleClose = useCallback(() => {
    if (!isEquipping) onClose()
  }, [isEquipping, onClose])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleClose, open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-white p-5 text-center shadow-2xl"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isEquipping}
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            <div
              className={cn(
                "mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-4 py-2 text-sm font-black text-white shadow-lg",
                presentation.accent,
              )}
            >
              <Sparkles className="h-4 w-4" />
              Drop encontrado
            </div>

            <motion.div
              className="relative mx-auto h-48 w-48"
              initial={{ rotate: -5, y: 12 }}
              animate={{
                rotate: [0, -3, 3, 0],
                y: [0, -10, 0],
                scale: [1, 1.04, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div
                className={cn(
                  "absolute inset-5 rounded-full blur-3xl",
                  presentation.glow,
                )}
              />
              <Image
                src={imageSrc}
                alt={itemName ?? presentation.title}
                fill
                sizes="192px"
                className="relative object-contain drop-shadow-2xl"
              />
            </motion.div>

            <div className="mt-3 space-y-2">
              <h2 className="text-2xl font-black leading-tight text-slate-900">
                {title}
              </h2>
              <p className="text-sm font-bold text-slate-500">
                {previewEmoji ? `${previewEmoji} ` : ""}
                {rarity ? `Raridade ${RARITY_LABELS[rarity]}` : "Novo item"}
              </p>
              {bonusLabel ? (
                <p className="rounded-2xl bg-sky-50 px-3 py-2 text-sm font-black text-sky-700">
                  {bonusLabel}
                </p>
              ) : null}
            </div>

            {showEquipAction ? (
              <div className="mt-6 grid gap-2">
                <button
                  type="button"
                  onClick={onEquip}
                  disabled={isEquipping}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r py-3 font-black text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-wait disabled:opacity-80",
                    presentation.accent,
                  )}
                >
                  {isEquipping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isEquipping ? "Equipando..." : "Equipar agora"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isEquipping}
                  className="w-full rounded-2xl bg-slate-100 py-3 font-black text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-wait disabled:opacity-70"
                >
                  Guardar no armário
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "mt-6 w-full rounded-2xl bg-gradient-to-r py-3 font-black text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]",
                  presentation.accent,
                )}
              >
                Legal!
              </button>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
