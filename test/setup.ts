import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"

// Cada teste começa com fetch mockado e storage limpos — nenhum teste
// deve bater na API real.
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn())
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// Helper para simular respostas JSON da API
export function mockJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}
