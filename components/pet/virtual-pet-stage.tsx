"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

type BackgroundKey = "bedroom" | "backyard" | "bg_bedroom" | "bg_backyard"
export type PetSpeciesKey = "dog" | "cat"
export type PetEffectKey = "water_magic" | "food_bone" | "freeze_potion"

export interface VirtualPetStageProps {
  streak: number
  isPremium?: boolean
  isCelebrating?: boolean
  isSick?: boolean
  currentBackground?: string | null
  species?: PetSpeciesKey | string | null
  effect?: PetEffectKey | string | null
  petName?: string
  className?: string
  children?: ReactNode
}

const PET_IMAGES: Record<
  PetSpeciesKey,
  {
    idle: string
    premium: string
    sad: string
    sick: string
    celebration: string
  }
> = {
  dog: {
    idle: "/assets/idle_happy.jpg",
    premium: "/assets/equipped_premium.jpg",
    sad: "/assets/sad_broken.jpg",
    sick: "/assets/dog_sick.jpg",
    celebration: "/assets/celebration.jpg",
  },
  cat: {
    idle: "/assets/cat_idle_happy.jpg",
    premium: "/assets/cat_equipped_premium.jpg",
    sad: "/assets/cat_sad_broken.jpg",
    sick: "/assets/cat_sad_broken.jpg",
    celebration: "/assets/cat_celebration.jpg",
  },
} as const

const BACKGROUND_IMAGES: Record<BackgroundKey, string> = {
  bedroom: "/assets/bg_bedroom.jpg",
  bg_bedroom: "/assets/bg_bedroom.jpg",
  backyard: "/assets/bg_backyard.jpg",
  bg_backyard: "/assets/bg_backyard.jpg",
}

const EFFECT_IMAGES: Record<
  PetEffectKey,
  {
    image: string
    label: string
    glowClass: string
  }
> = {
  water_magic: {
    image: "/assets/water_drop.jpg",
    label: "Água mágica",
    glowClass: "bg-sky-300/45",
  },
  food_bone: {
    image: "/assets/food_bone.jpg",
    label: "Osso dourado",
    glowClass: "bg-amber-300/45",
  },
  freeze_potion: {
    image: "/assets/potion_freeze.jpg",
    label: "Poção de proteção",
    glowClass: "bg-indigo-300/45",
  },
}

function resolveBackground(currentBackground?: string | null) {
  if (!currentBackground) return BACKGROUND_IMAGES.bedroom
  if (currentBackground.startsWith("/")) return currentBackground
  return (
    BACKGROUND_IMAGES[currentBackground as BackgroundKey] ??
    BACKGROUND_IMAGES.bedroom
  )
}

export function resolvePetSpecies(species?: string | null): PetSpeciesKey {
  if (!species) return "dog"
  const normalized = species.toLowerCase()
  if (
    normalized.includes("cat") ||
    normalized.includes("gato") ||
    normalized.includes("felino")
  )
    return "cat"
  return "dog"
}

export function resolvePetEffect(effect?: string | null) {
  if (!effect) return null

  const normalized = effect.toLowerCase()
  if (normalized.includes("water") || normalized.includes("agua"))
    return EFFECT_IMAGES.water_magic
  if (normalized.includes("bone") || normalized.includes("osso"))
    return EFFECT_IMAGES.food_bone
  if (
    normalized.includes("freeze") ||
    normalized.includes("potion") ||
    normalized.includes("pocao") ||
    normalized.includes("ice")
  )
    return EFFECT_IMAGES.freeze_potion

  return null
}

export function resolvePetImage({
  streak,
  isPremium,
  isCelebrating,
  isSick,
  species,
}: Required<
  Pick<
    VirtualPetStageProps,
    "streak" | "isPremium" | "isCelebrating" | "isSick"
  >
> &
  Pick<VirtualPetStageProps, "species">) {
  const images = PET_IMAGES[resolvePetSpecies(species)]
  if (isSick) return images.sick
  if (streak === 0) return images.sad
  if (isCelebrating) return images.celebration
  if (isPremium) return images.premium
  return images.idle
}

function resolveMotion(
  streak: number,
  isCelebrating: boolean,
  isSick: boolean,
) {
  if (streak === 0 || isSick) {
    return {
      animate: { y: 0, scale: 0.96, rotate: -1 },
      transition: { duration: 0.35, ease: "easeOut" as const },
    }
  }

  if (isCelebrating) {
    return {
      animate: { y: [0, -34, 0, -18, 0], scale: [1, 1.08, 1.02, 1.05, 1] },
      transition: { duration: 0.9, repeat: Infinity, repeatDelay: 0.9 },
    }
  }

  return {
    animate: { y: [0, -7, 0], scale: [1, 1.018, 1] },
    transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" as const },
  }
}

export function VirtualPetStage({
  streak,
  isPremium = false,
  isCelebrating = false,
  isSick = false,
  currentBackground = "bedroom",
  species = "dog",
  effect = null,
  petName = "Pet",
  className,
  children,
}: VirtualPetStageProps) {
  const safeStreak = Math.max(0, streak)
  const petImage = resolvePetImage({
    streak: safeStreak,
    isPremium,
    isCelebrating,
    isSick,
    species,
  })
  const motionState = resolveMotion(safeStreak, isCelebrating, isSick)
  const effectPreset = resolvePetEffect(effect)
  const showEffect = Boolean(effectPreset && safeStreak > 0 && !isSick)

  return (
    <section
      className={cn(
        "relative isolate min-h-[360px] overflow-hidden rounded-[2rem] bg-slate-100 shadow-xl",
        className,
      )}
      aria-label={`Palco de ${petName}`}
    >
      <Image
        src={resolveBackground(currentBackground)}
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 720px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10" />

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-950/20 to-transparent" />

      <div className="relative z-10 flex min-h-[360px] items-end justify-center px-5 pb-6 pt-10">
        {children ? (
          <div className="absolute left-4 right-4 top-4 z-20">{children}</div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={petImage}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{
              opacity: 1,
              ...motionState.animate,
            }}
            exit={{ opacity: 0, scale: 0.9, y: 18 }}
            transition={motionState.transition}
            className="relative h-[235px] w-[235px] sm:h-[280px] sm:w-[280px]"
          >
            {isCelebrating && safeStreak > 0 && !isSick ? (
              <motion.div
                className="absolute inset-4 rounded-full bg-amber-300/45 blur-3xl"
                animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            ) : null}
            <Image
              src={petImage}
              alt={petName}
              fill
              sizes="280px"
              className="z-10 object-contain drop-shadow-2xl"
            />
            {showEffect && effectPreset ? (
              <motion.div
                className="pointer-events-none absolute inset-0 z-20"
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className={cn(
                    "absolute inset-8 rounded-full blur-3xl",
                    effectPreset.glowClass,
                  )}
                />
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    className="absolute"
                    style={{
                      left: `${18 + index * 28}%`,
                      top: `${24 + (index % 2) * 22}%`,
                    }}
                    animate={{
                      y: [0, -18, 0],
                      opacity: [0.4, 0.95, 0.4],
                      scale: [0.72, 1, 0.72],
                    }}
                    transition={{
                      duration: 2.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.32,
                    }}
                  >
                    <Image
                      src={effectPreset.image}
                      alt=""
                      width={46}
                      height={46}
                      className="object-contain drop-shadow-xl"
                    />
                  </motion.div>
                ))}
                <span className="sr-only">{effectPreset.label}</span>
              </motion.div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
