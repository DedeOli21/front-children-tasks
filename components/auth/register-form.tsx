"use client"

import type React from "react"

import { useState } from "react"
import { Star, Mail, Lock, User, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { authApi } from "@/lib/api"

interface RegisterFormProps {
  onSuccess: (token: string) => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validacoes
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem")
      return
    }

    setIsLoading(true)

    try {
      // API call para registro
      const response = await authApi.register({ name, email, password })

      // Salva o token no localStorage (API retorna access_token)
      const token = response.access_token
      localStorage.setItem("token", token)
      onSuccess(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 px-4 py-8">
      {/* Botao Voltar */}
      <button
        onClick={onSwitchToLogin}
        className="absolute left-4 top-4 flex items-center gap-2 rounded-xl bg-card px-4 py-2 font-bold text-muted-foreground shadow-md hover:bg-muted transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      {/* Logo animado */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative mb-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-orange-500 shadow-xl">
            <Star className="h-10 w-10 fill-yellow-300 text-yellow-300" />
          </div>
        </div>
        <h1 className="text-xl font-black text-foreground">Criar Nova Conta</h1>
      </div>

      {/* Card de Registro */}
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl">
        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-3 text-center text-sm font-semibold text-red-600 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nome */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-border bg-muted py-4 pl-12 pr-4 text-base font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-border bg-muted py-4 pl-12 pr-4 text-base font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha (min. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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

          {/* Confirmar Senha */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-border bg-muted py-4 pl-12 pr-4 text-base font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Botao de Registro */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-orange-500 py-4 text-lg font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                <Star className="h-5 w-5" />
                Criar Conta
              </>
            )}
          </button>
        </form>

        {/* Link para login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Ja tem uma conta?{" "}
            <button onClick={onSwitchToLogin} className="font-bold text-primary hover:underline">
              Entrar
            </button>
          </p>
        </div>
      </div>

      {/* Dicas */}
      <div className="mt-6 w-full max-w-sm rounded-2xl bg-secondary/50 p-4">
        <p className="text-center text-sm font-semibold text-secondary-foreground">
          Dica: Use o email dos pais para gerenciar o quadro de recompensas!
        </p>
      </div>
    </div>
  )
}
