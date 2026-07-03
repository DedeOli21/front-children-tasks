"use client"

// Efeitos sonoros sintetizados com WebAudio — sem arquivos de áudio,
// feedback imediato na loja e nos cuidados com a planta.
let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === "suspended") {
      // Retomado no primeiro gesto do usuário (política dos navegadores)
      void audioContext.resume()
    }
    return audioContext
  } catch {
    return null
  }
}

function tone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15,
) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startAt)
  gain.gain.setValueAtTime(volume, ctx.currentTime + startAt)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(ctx.currentTime + startAt)
  oscillator.stop(ctx.currentTime + startAt + duration)
}

// 💧 Água: gotinhas descendo
export function playWaterSound() {
  const ctx = getContext()
  if (!ctx) return
  tone(ctx, 700, 0, 0.12, "sine")
  tone(ctx, 520, 0.09, 0.14, "sine")
  tone(ctx, 400, 0.2, 0.18, "sine")
}

// 😋 Comida: mordidinhas
export function playEatSound() {
  const ctx = getContext()
  if (!ctx) return
  tone(ctx, 260, 0, 0.08, "square", 0.08)
  tone(ctx, 300, 0.11, 0.08, "square", 0.08)
  tone(ctx, 340, 0.22, 0.1, "square", 0.08)
}

// 🫧 Bolha estourando
export function playBubbleSound() {
  const ctx = getContext()
  if (!ctx) return
  tone(ctx, 900, 0, 0.06, "sine", 0.1)
  tone(ctx, 1300, 0.05, 0.08, "sine", 0.08)
}

// ⭐ Compra: moedinhas
export function playCoinSound() {
  const ctx = getContext()
  if (!ctx) return
  tone(ctx, 880, 0, 0.09, "triangle", 0.12)
  tone(ctx, 1320, 0.08, 0.16, "triangle", 0.12)
}
