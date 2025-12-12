"use client"

import { useState, useEffect, useCallback } from "react"
import { authApi } from "@/lib/api"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user"
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

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
        setUser(profile)
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

  const login = useCallback((token: string, userData?: User) => {
    localStorage.setItem("token", token)
    if (userData) setUser(userData)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    setUser(null)
  }, [])

  const isAdmin = user?.role === "admin"

  return {
    isAuthenticated,
    isLoading,
    user,
    isAdmin,
    login,
    logout,
  }
}
