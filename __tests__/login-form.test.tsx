import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { mockJsonResponse } from "../test/setup"
import { LoginForm } from "@/components/auth/login-form"

describe("LoginForm", () => {
  it("renderiza campos de usuário e senha", () => {
    render(<LoginForm onSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />)

    expect(screen.getByPlaceholderText("Email ou usuário")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Senha")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument()
  })

  it("envia as credenciais, guarda o token e devolve o usuário logado", async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const fetchMock = vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse({
        access_token: "jwt-teste",
        user: { id: "u1", name: "Gabriel", email: "gabriel", role: "child" },
      }),
    )

    render(<LoginForm onSuccess={onSuccess} onSwitchToRegister={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Email ou usuário"), "gabriel")
    await user.type(screen.getByPlaceholderText("Senha"), "1234")
    await user.click(screen.getByRole("button", { name: /entrar/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())

    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toContain("/api/auth/login")
    expect(JSON.parse(String(options?.body))).toEqual({ email: "gabriel", password: "1234" })

    expect(localStorage.getItem("token")).toBe("jwt-teste")
    expect(onSuccess).toHaveBeenCalledWith(
      "jwt-teste",
      expect.objectContaining({ role: "child", name: "Gabriel" }),
    )
  })

  it("mostra a mensagem de erro da API quando o login falha", async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ message: "Credenciais inválidas" }, 401))

    render(<LoginForm onSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Email ou usuário"), "gabriel")
    await user.type(screen.getByPlaceholderText("Senha"), "errada")
    await user.click(screen.getByRole("button", { name: /entrar/i }))

    expect(await screen.findByText("Credenciais inválidas")).toBeInTheDocument()
    expect(localStorage.getItem("token")).toBeNull()
  })
})
