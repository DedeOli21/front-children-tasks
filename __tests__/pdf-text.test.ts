import { describe, it, expect } from "vitest"
import { sanitizeForPdf } from "@/lib/pdf-text"

// Regressão dos casos reais que apareciam corrompidos no PDF
// ("Ø<ß9", "+P") porque o jsPDF não suporta emoji nas fontes padrão.
describe("sanitizeForPdf", () => {
  it("remove emoji do plano suplementar preservando o resto do texto", () => {
    expect(sanitizeForPdf("Comprou na Loja Botânica: Rosa 🌹")).toBe(
      "Comprou na Loja Botânica: Rosa",
    )
  })

  it("remove estrela e mantém acentos do português", () => {
    expect(sanitizeForPdf("⭐ Professor(a) professor3: Bom desempenho na escola")).toBe(
      "Professor(a) professor3: Bom desempenho na escola",
    )
  })

  it("remove símbolos compostos com seletor de variação (coração roxo)", () => {
    expect(sanitizeForPdf("💜 Terapeuta fernanda: Fez todas as atividades concentrado")).toBe(
      "Terapeuta fernanda: Fez todas as atividades concentrado",
    )
  })

  it("remove escudo/regador e outros símbolos diversos", () => {
    expect(sanitizeForPdf("🛡️ Seu Regador Mágico te salvou!")).toBe(
      "Seu Regador Mágico te salvou!",
    )
  })

  it("não altera texto sem emoji", () => {
    expect(sanitizeForPdf("Tarefa aprovada: Escovar os dentes")).toBe(
      "Tarefa aprovada: Escovar os dentes",
    )
  })

  it("lida com null/undefined/vazio sem lançar erro", () => {
    expect(sanitizeForPdf(null)).toBe("")
    expect(sanitizeForPdf(undefined)).toBe("")
    expect(sanitizeForPdf("")).toBe("")
  })
})
