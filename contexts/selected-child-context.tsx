"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

interface SelectedChildContextValue {
  selectedChildId: string | null
  setSelectedChildId: (childId: string | null) => void
  clearSelectedChild: () => void
}

const SelectedChildContext = createContext<SelectedChildContextValue | null>(null)

const STORAGE_KEY = "selectedChildId"

export function SelectedChildProvider({ children }: { children: React.ReactNode }) {
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setSelectedChildIdState(stored)
  }, [])

  const setSelectedChildId = useCallback((childId: string | null) => {
    setSelectedChildIdState(childId)
    if (childId) {
      localStorage.setItem(STORAGE_KEY, childId)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const clearSelectedChild = useCallback(() => {
    setSelectedChildId(null)
  }, [setSelectedChildId])

  const value = useMemo(
    () => ({ selectedChildId, setSelectedChildId, clearSelectedChild }),
    [clearSelectedChild, selectedChildId, setSelectedChildId],
  )

  return <SelectedChildContext.Provider value={value}>{children}</SelectedChildContext.Provider>
}

export function useSelectedChild() {
  const context = useContext(SelectedChildContext)
  if (!context) {
    throw new Error("useSelectedChild deve ser usado dentro de SelectedChildProvider")
  }
  return context
}
