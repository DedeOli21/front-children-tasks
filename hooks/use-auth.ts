"use client"

import { useState, useEffect, useCallback } from "react"
import { authApi, type UserProfile, type UserRole } from "@/lib/api"

// Papéis antigos do backend legado
function normalizeRole(role: string): UserRole {
  if (role === "admin") return "parent"
  if (role === "user") return "child"
  return role as UserRole
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      try {
        const profile = await authApi.getProfile()
        setUser({ ...profile, role: normalizeRole(profile.role) })
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem("token")
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback((token: string, userData?: UserProfile) => {
    localStorage.setItem("token", token)
    if (userData) {
      setUser({ ...userData, role: normalizeRole(userData.role) })
    }
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    setUser(null)
  }, [])

  const role = user?.role ?? null

  return {
    isAuthenticated,
    isLoading,
    user,
    role,
    isParent: role === "parent",
    isChild: role === "child",
    isTeacher: role === "teacher",
    isTherapist: role === "therapist",
    login,
    logout,
  }
}
