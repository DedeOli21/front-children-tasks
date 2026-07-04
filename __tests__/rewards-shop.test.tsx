import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { RewardsShop } from "@/components/rewards-shop"
import type { Reward } from "@/lib/api"

const REWARDS: Reward[] = [
  {
    id: "r1",
    title: "Sobremesa especial",
    emoji: "🍰",
    cost: 5,
    description: "Escolha a sobremesa",
  },
  {
    id: "r2",
    title: "Brinquedo",
    emoji: "🎁",
    cost: 50,
    description: "Um brinquedo pequeno",
  },
]

describe("RewardsShop (custo por recompensa)", () => {
  it("habilita apenas recompensas que cabem no saldo", () => {
    render(<RewardsShop stars={10} rewards={REWARDS} onRedeem={vi.fn()} />)

    const cheap = screen.getByText("Sobremesa especial").closest("button")!
    const expensive = screen.getByText("Brinquedo").closest("button")!

    expect(cheap).toBeEnabled()
    expect(expensive).toBeDisabled()
  })

  it("resgata após confirmação no modal", () => {
    const onRedeem = vi.fn()
    render(<RewardsShop stars={10} rewards={REWARDS} onRedeem={onRedeem} />)

    fireEvent.click(screen.getByText("Sobremesa especial").closest("button")!)
    expect(screen.getByText("Resgatar Recompensa?")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /resgatar!/i }))
    expect(onRedeem).toHaveBeenCalledWith("r1")
  })

  it("cancelar a confirmação não resgata", () => {
    const onRedeem = vi.fn()
    render(<RewardsShop stars={10} rewards={REWARDS} onRedeem={onRedeem} />)

    fireEvent.click(screen.getByText("Sobremesa especial").closest("button")!)
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))

    expect(onRedeem).not.toHaveBeenCalled()
    expect(screen.queryByText("Resgatar Recompensa?")).not.toBeInTheDocument()
  })

  it("sem saldo para nada, mostra quanto falta para a mais barata", () => {
    render(<RewardsShop stars={2} rewards={REWARDS} onRedeem={vi.fn()} />)

    expect(screen.getByText(/junte 5 estrelas/i)).toBeInTheDocument()
    expect(screen.getByText(/3 estrelas?/)).toBeInTheDocument()
  })

  it("mostra estado vazio sem pedir zero estrelas", () => {
    render(<RewardsShop stars={0} rewards={[]} onRedeem={vi.fn()} />)

    expect(screen.getByText(/loja vazia/i)).toBeInTheDocument()
    expect(
      screen.getByText(/nenhuma recompensa cadastrada/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/junte 0 estrelas/i)).not.toBeInTheDocument()
  })
})
