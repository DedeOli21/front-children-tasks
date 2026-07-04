"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

type BackgroundKey = "bedroom" | "backyard" | "bg_bedroom" | "bg_backyard"

export interface VirtualPetStageProps {
  streak: number
  isPremium?: boolean
  isCelebrating?: boolean
  currentBackground?: string | null
  petName?: string
  className?: string
  children?: ReactNode
}

const PET_IMAGES = {
  idle: "/assets/idle_happy.jpg",
  premium: "/assets/equipped_premium.jpg",
  sad: "/assets/sad_broken.jpg",
  celebration: "/assets/celebration.jpg",
} as const

const BACKGROUND_IMAGES: Record<BackgroundKey, string> = {
  bedroom: "/assets/bg_bedroom.jpg",
  bg_bedroom: "/assets/bg_bedroom.jpg",
  backyard: "/assets/bg_backyard.jpg",
  bg_backyard: "/assets/bg_backyard.jpg",
}

function resolveBackground(currentBackground?: string | null) {
  if (!currentBackground) return BACKGROUND_IMAGES.bedroom
  if (currentBackground.startsWith("/")) return currentBackground
  return (
    BACKGROUND_IMAGES[currentBackground as BackgroundKey] ??
    BACKGROUND_IMAGES.bedroom
  )
}

function resolvePetImage({
  streak,
  isPremium,
  isCelebrating,
}: Required<Pick<VirtualPetStageProps, "streak" | "isPremium" | "isCelebrating">>) {
  if (streak === 0) return PET_IMAGES.sad
  if (isCelebrating) return PET_IMAGES.celebration
  if (isPremium) return PET_IMAGES.premium
  return PET_IMAGES.idle
}

function resolveMotion(streak: number, isCelebrating: boolean) {
  if (streak === 0) {
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
  currentBackground = "bedroom",
  petName = "Pet",
  className,
  children,
}: VirtualPetStageProps) {
  const safeStreak = Math.max(0, streak)
  const petImage = resolvePetImage({
    streak: safeStreak,
    isPremium,
    isCelebrating,
  })
  const motionState = resolveMotion(safeStreak, isCelebrating)

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
            {isCelebrating && safeStreak > 0 ? (
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
              className="object-contain drop-shadow-2xl"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
