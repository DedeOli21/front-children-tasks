"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ChildHome } from "@/components/child-home"
import { ParentDashboard } from "@/components/parent/parent-dashboard"
import { TeacherPortal } from "@/components/teacher/teacher-portal"
import { useAuth } from "@/hooks/use-auth"

// Roteia para a experiência certa conforme o papel:
// criança → visão gamificada; responsável → painel administrativo;
// professor → portal de acompanhamento escolar.
export default function HomePage() {
  const { isAuthenticated, isLoading, user, role, login, logout } = useAuth()
  const [authView, setAuthView] = useState<"login" | "register">("login")

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold text-muted-foreground">Verificando...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated || !user) {
    if (authView === "register") {
      return <RegisterForm onSuccess={login} onSwitchToLogin={() => setAuthView("login")} />
    }
    return <LoginForm onSuccess={login} onSwitchToRegister={() => setAuthView("register")} />
  }

  if (role === "parent") {
    return <ParentDashboard parentName={user.name} onLogout={logout} />
  }

  if (role === "teacher") {
    return <TeacherPortal teacherName={user.name} onLogout={logout} />
  }

  return <ChildHome childName={user.name} onLogout={logout} />
}
