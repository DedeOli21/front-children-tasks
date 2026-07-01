"use client"

import type React from "react"

import { useState } from "react"
import { Star, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import { authApi, type UserProfile } from "@/lib/api"

interface LoginFormProps {
  onSuccess: (token: string, user?: UserProfile) => void
  onSwitchToRegister: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // API call para login
      const response = await authApi.login({ email, password })

      // Salva o token no localStorage (API retorna access_token)
      const token = response.access_token
      localStorage.setItem("token", token)
      onSuccess(token, response.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 px-4">
      {/* Logo animado */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-500 shadow-xl">
            <Star className="h-12 w-12 fill-yellow-300 text-yellow-300 animate-pulse" />
          </div>
          <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-lg font-black text-white shadow-lg">
            G
          </div>
        </div>
        <h1 className="text-2xl font-black text-foreground">Quadro de Recompensas</h1>
      </div>

      {/* Card de Login */}
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl">
        <h2 className="mb-6 text-center text-xl font-bold text-foreground">Entrar</h2>

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-3 text-center text-sm font-semibold text-red-600 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Email ou usuário"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoCapitalize="none"
              className="w-full rounded-xl border-2 border-border bg-muted py-4 pl-12 pr-4 text-base font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-border bg-muted py-4 pl-12 pr-12 text-base font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Botao de Login */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-500 py-4 text-lg font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        {/* Link para registro */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nao tem uma conta?{" "}
            <button onClick={onSwitchToRegister} className="font-bold text-primary hover:underline">
              Criar conta
            </button>
          </p>
        </div>
      </div>

      {/* Footer divertido */}
      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-lg">🌟</span>
        <span className="font-semibold">Vamos conquistar estrelas!</span>
        <span className="text-lg">🌟</span>
      </div>
    </div>
  )
}
