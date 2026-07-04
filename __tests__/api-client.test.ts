import { describe, it, expect, vi } from "vitest"
import { mockJsonResponse } from "../test/setup"
import {
  activeTasksApi,
  tasksApi,
  starsApi,
  missionsApi,
  authApi,
  proactiveRequestsApi,
  petApi,
} from "@/lib/api"

// Valida que o cliente HTTP monta as rotas, os parâmetros e os headers
// exatamente como a API NestJS espera.
describe("cliente de API", () => {
  it("envia o token Bearer nas rotas autenticadas", async () => {
    localStorage.setItem("token", "meu-token")
    const fetchMock = vi.mocked(fetch).mockResolvedValue(mockJsonResponse([]))

    await tasksApi.list()

    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toContain("/api/tasks")
    expect((options?.headers as Record<string, string>).Authorization).toBe(
      "Bearer meu-token",
    )
  })

  it("anexa ?childId= quando o responsável age sobre uma criança", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(mockJsonResponse([]))

    await tasksApi.list("crianca-1")
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/tasks?childId=crianca-1",
    )

    await starsApi.getBalance("crianca-1")
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      "/api/stars?childId=crianca-1",
    )

    await tasksApi.complete("tarefa-9", "crianca-1")
    expect(String(fetchMock.mock.calls[2][0])).toContain(
      "/api/tasks/tarefa-9/complete?childId=crianca-1",
    )

    await activeTasksApi.forDay(undefined, "crianca-1")
    expect(String(fetchMock.mock.calls[3][0])).toContain(
      "/api/active-tasks/day?childId=crianca-1",
    )
  })

  it("mapeia os campos da API para o formato do frontend (iconEmoji → emoji, status)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse([
        {
          id: "t1",
          title: "Escovar os dentes",
          iconEmoji: "🪥",
          completedToday: true,
          status: "approved",
        },
      ]),
    )

    const tasks = await tasksApi.list()

    expect(tasks[0]).toMatchObject({
      id: "t1",
      emoji: "🪥",
      completed: true,
      status: "approved",
    })
  })

  it("bonificação da terapeuta usa POST /api/stars/suggest com motivo", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(mockJsonResponse({ id: "r1", status: "pending" }))

    await starsApi.suggest({
      childId: "c1",
      amount: 3,
      reason: "Ótima sessão",
    })

    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toContain("/api/stars/suggest")
    expect(options?.method).toBe("POST")
    expect(JSON.parse(String(options?.body))).toEqual({
      childId: "c1",
      amount: 3,
      reason: "Ótima sessão",
    })
  })

  it("aprovação de missão usa PATCH /api/missions/:id/approve", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(mockJsonResponse({ currentStars: 5 }))

    await missionsApi.approve("m1")

    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toContain("/api/missions/m1/approve")
    expect(options?.method).toBe("PATCH")
  })

  it("equipamento do pet usa PATCH /api/pet/inventory/:itemId/equip", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(mockJsonResponse({ equipped: true }))

    await petApi.equip("pet-item-1")

    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toContain("/api/pet/inventory/pet-item-1/equip")
    expect(options?.method).toBe("PATCH")
  })

  it("escolha do mascote usa PATCH /api/pet/species", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(mockJsonResponse({ modelKey: "cat_orange" }))

    await petApi.chooseSpecies("cat")

    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toContain("/api/pet/species")
    expect(options?.method).toBe("PATCH")
    expect(JSON.parse(String(options?.body))).toEqual({ species: "cat" })
  })

  it("Super Iniciativa cria, lista pendentes e aprova com ajuste de estrelas", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(mockJsonResponse({ id: "p1", status: "pending" }))

    await proactiveRequestsApi.create({
      categoryIcon: "studies",
      description: "Li um livro sozinho",
      suggestedStars: 4,
    })

    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/proactive-requests",
    )
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST")
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      categoryIcon: "studies",
      description: "Li um livro sozinho",
      suggestedStars: 4,
    })

    await proactiveRequestsApi.pending("crianca-1")
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      "/api/proactive-requests/pending?childId=crianca-1",
    )

    await proactiveRequestsApi.approve("p1", 6)
    expect(String(fetchMock.mock.calls[2][0])).toContain(
      "/api/proactive-requests/p1/approve",
    )
    expect(fetchMock.mock.calls[2][1]?.method).toBe("PATCH")
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual({
      finalStars: 6,
    })
  })

  it("propaga a mensagem de erro da API em respostas não-ok", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse({ message: "Estrelas insuficientes" }, 400),
    )

    await expect(missionsApi.approve("m1")).rejects.toThrow(
      "Estrelas insuficientes",
    )
  })

  it("sessão expirada (401 com token) limpa o token e rejeita", async () => {
    localStorage.setItem("token", "expirado")
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse({ message: "Unauthorized" }, 401),
    )
    const reloadSpy = vi
      .spyOn(window.location, "reload")
      .mockImplementation(() => {})

    await expect(tasksApi.list()).rejects.toThrow("Sessão expirada")
    expect(localStorage.getItem("token")).toBeNull()
    expect(reloadSpy).toHaveBeenCalled()
  })

  it("401 no login (senha errada) NÃO derruba a sessão", async () => {
    localStorage.setItem("token", "valido")
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse({ message: "Credenciais inválidas" }, 401),
    )

    await expect(
      authApi.login({ email: "x@x.com", password: "errada" }),
    ).rejects.toThrow("Credenciais inválidas")
    expect(localStorage.getItem("token")).toBe("valido")
  })
})
