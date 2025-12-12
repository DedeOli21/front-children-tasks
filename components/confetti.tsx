"use client"

import { useEffect, useState } from "react"

const CONFETTI_COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"]
const CONFETTI_SHAPES = ["●", "■", "▲", "★", "♦"]

interface ConfettiPiece {
  id: number
  left: number
  color: string
  shape: string
  delay: number
  duration: number
}

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    const newPieces: ConfettiPiece[] = []
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      })
    }
    setPieces(newPieces)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute text-2xl"
          style={{
            left: `${piece.left}%`,
            top: "-20px",
            color: piece.color,
            animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
          }}
        >
          {piece.shape}
        </div>
      ))}
    </div>
  )
}
