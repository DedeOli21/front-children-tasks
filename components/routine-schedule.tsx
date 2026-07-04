"use client"

import { useState, useEffect, useMemo } from "react"
import { Sun, Moon, Clock, CheckCircle2, Loader2 } from "lucide-react"
import { routinesApi, type RecurrenceDay, type RoutineItem } from "@/lib/api"

const WEEK_DAYS: RecurrenceDay[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]

function getTodayRecurrenceDay(): RecurrenceDay {
  return WEEK_DAYS[new Date().getDay()] ?? "sunday"
}

interface RoutineScheduleProps {
  routines: RoutineItem[]
  onRoutineToggle?: (routineId: string, completed: boolean) => void
}

export function RoutineSchedule({ routines, onRoutineToggle }: RoutineScheduleProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set())
  const today = getTodayRecurrenceDay()
  const todaysRoutines = useMemo(
    () =>
      routines.filter((routine) => {
        const days = routine.recurrenceDays?.length
          ? routine.recurrenceDays
          : WEEK_DAYS
        return days.includes(today)
      }),
    [routines, today],
  )

  // Inicializa checkedItems com as rotinas já completadas hoje
  useEffect(() => {
    const completedIds = todaysRoutines
      .filter((r) => r.completedToday)
      .map((r) => r.id)
    setCheckedItems(new Set(completedIds))
  }, [todaysRoutines])

  const toggleItem = async (id: string) => {
    const wasChecked = checkedItems.has(id)
    
    // Marca como loading
    setLoadingItems((prev) => new Set(prev).add(id))

    // Atualiza o estado local otimisticamente
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

    try {
      // Persiste no backend
      if (wasChecked) {
        await routinesApi.uncomplete(id)
      } else {
        await routinesApi.complete(id)
      }
      
      // Notifica o pai se callback foi fornecido
      onRoutineToggle?.(id, !wasChecked)
    } catch (error) {
      console.error("Erro ao atualizar rotina:", error)
      // Reverte o estado em caso de erro
      setCheckedItems((prev) => {
        const next = new Set(prev)
        if (wasChecked) {
          next.add(id)
        } else {
          next.delete(id)
        }
        return next
      })
    } finally {
      // Remove loading
      setLoadingItems((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Separar rotinas em manhã e tarde/noite
  const morningRoutines = todaysRoutines.filter((r) => r.period === "morning")
  const eveningRoutines = todaysRoutines.filter((r) => r.period === "evening")

  const completedCount = checkedItems.size
  const totalCount = todaysRoutines.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const renderRoutineItem = (item: RoutineItem, periodColor: { checked: string; unchecked: string }) => {
    const isChecked = checkedItems.has(item.id)
    const isLoading = loadingItems.has(item.id)

    return (
      <button
        key={item.id}
        onClick={() => toggleItem(item.id)}
        disabled={isLoading}
        className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all duration-300 ${
          isChecked
            ? "border-emerald-400 bg-emerald-50"
            : "border-border bg-card hover:border-primary/50 hover:shadow-md"
        } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
            isChecked ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isChecked ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
        </div>
        <div className="flex flex-1 items-center gap-2 text-left">
          <span className="text-2xl">{item.emoji}</span>
          <div className="flex-1">
            <span
              className={`font-semibold ${isChecked ? "text-emerald-700 line-through" : "text-foreground"}`}
            >
              {item.title}
            </span>
          </div>
          {item.time && (
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold ${
                isChecked ? "bg-emerald-200 text-emerald-700" : periodColor.unchecked
              }`}
            >
              {item.time}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progresso do dia */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-bold">Progresso do Dia</span>
          <span className="text-lg font-black">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {progressPercent === 100 && (
          <p className="mt-2 text-center text-sm font-semibold">🎉 Parabéns! Você completou todas as atividades!</p>
        )}
      </div>

      {/* Rotina da Manhã */}
      {morningRoutines.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Sun className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-lg font-black text-foreground">Manhã</h2>
          </div>

          <div className="space-y-2">
            {morningRoutines.map((item) =>
              renderRoutineItem(item, { checked: "bg-emerald-200 text-emerald-700", unchecked: "bg-primary/10 text-primary" })
            )}
          </div>
        </div>
      )}

      {/* Rotina da Tarde/Noite */}
      {eveningRoutines.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
              <Moon className="h-6 w-6 text-indigo-500" />
            </div>
            <h2 className="text-lg font-black text-foreground">Tarde / Noite</h2>
          </div>

          <div className="space-y-2">
            {eveningRoutines.map((item) =>
              renderRoutineItem(item, { checked: "bg-emerald-200 text-emerald-700", unchecked: "bg-indigo-100 text-indigo-600" })
            )}
          </div>
        </div>
      )}

      {/* Mensagem quando não há rotinas */}
      {todaysRoutines.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">Nenhuma rotina cadastrada ainda.</p>
        </div>
      )}

      {/* Dica do dia */}
      <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="text-center text-sm text-muted-foreground">
          <span className="font-bold text-primary">Dica:</span> Use um timer para ajudar nas atividades com tempo
          definido!
        </p>
      </div>
    </div>
  )
}
