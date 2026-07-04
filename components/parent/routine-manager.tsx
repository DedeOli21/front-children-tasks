"use client"

import { useMemo, useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import {
  CalendarDays,
  Check,
  Clock,
  Pencil,
  Plus,
  Repeat2,
  School,
  Trash2,
  Umbrella,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { SmartTaskInput } from "@/components/parent/smart-task-input"
import type { RecurrenceDay, RoutineItem } from "@/lib/api"

const WEEK_DAYS: { key: RecurrenceDay; short: string; label: string }[] = [
  { key: "sunday", short: "D", label: "Domingo" },
  { key: "monday", short: "S", label: "Segunda" },
  { key: "tuesday", short: "T", label: "Terca" },
  { key: "wednesday", short: "Q", label: "Quarta" },
  { key: "thursday", short: "Q", label: "Quinta" },
  { key: "friday", short: "S", label: "Sexta" },
  { key: "saturday", short: "S", label: "Sabado" },
]

const ALL_DAYS = WEEK_DAYS.map((day) => day.key)
const SCHOOL_DAYS: RecurrenceDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
]
const WEEKEND_DAYS: RecurrenceDay[] = ["saturday", "sunday"]

type RoutineForm = {
  time: string
  title: string
  emoji: string
  period: "morning" | "evening"
  recurrenceDays: RecurrenceDay[]
}

const emptyForm: RoutineForm = {
  time: "07:30",
  title: "",
  emoji: "✅",
  period: "morning",
  recurrenceDays: ALL_DAYS,
}

function hasSameDays(days: RecurrenceDay[], expected: RecurrenceDay[]) {
  return (
    days.length === expected.length && expected.every((day) => days.includes(day))
  )
}

function formatDays(days: RecurrenceDay[] | undefined) {
  const normalized = days?.length ? days : ALL_DAYS
  if (hasSameDays(normalized, ALL_DAYS)) return "Todos os dias"
  if (hasSameDays(normalized, SCHOOL_DAYS)) return "Dias de aula"
  if (hasSameDays(normalized, WEEKEND_DAYS)) return "Fim de semana"
  return WEEK_DAYS.filter((day) => normalized.includes(day.key))
    .map((day) => day.short)
    .join(" ")
}

interface RoutineManagerProps {
  selectedChildId: string | null
  childName?: string
  routines: RoutineItem[]
  onCreate: (routine: Omit<RoutineItem, "id">) => void | Promise<void>
  onUpdate: (id: string, routine: Partial<RoutineItem>) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}

export function RoutineManager({
  selectedChildId,
  childName,
  routines,
  onCreate,
  onUpdate,
  onDelete,
}: RoutineManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RoutineForm>(emptyForm)
  const selectedDays = useMemo(
    () => new Set(form.recurrenceDays),
    [form.recurrenceDays],
  )

  const sortedRoutines = useMemo(
    () =>
      [...routines].sort((a, b) => {
        const timeDiff = (a.time || "99:99").localeCompare(b.time || "99:99")
        return timeDiff === 0 ? a.title.localeCompare(b.title) : timeDiff
      }),
    [routines],
  )

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setIsOpen(false)
  }

  const setDays = (days: RecurrenceDay[]) => {
    setForm((current) => ({
      ...current,
      recurrenceDays: Array.from(new Set(days)),
    }))
  }

  const toggleDay = (day: RecurrenceDay) => {
    setForm((current) => ({
      ...current,
      recurrenceDays: current.recurrenceDays.includes(day)
        ? current.recurrenceDays.filter((item) => item !== day)
        : [...current.recurrenceDays, day],
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedChildId) {
      toast.error("Selecione uma crianca")
      return
    }
    if (!form.title.trim()) {
      toast.error("Informe o nome da rotina")
      return
    }
    if (!form.emoji.trim()) {
      toast.error("Escolha um emoji")
      return
    }
    if (form.recurrenceDays.length === 0) {
      toast.error("Selecione pelo menos um dia")
      return
    }

    const payload = {
      childId: selectedChildId,
      title: form.title.trim(),
      emoji: form.emoji,
      time: form.time,
      period: form.period,
      recurrenceDays: form.recurrenceDays,
      completedToday: false,
    }

    try {
      if (editingId) {
        await onUpdate(editingId, payload)
        toast.success("Rotina atualizada")
      } else {
        await onCreate(payload)
        toast.success("Rotina criada")
      }
      resetForm()
    } catch {
      // O dashboard ja mostra a mensagem de erro especifica.
    }
  }

  const startEdit = (routine: RoutineItem) => {
    setEditingId(routine.id)
    setIsOpen(true)
    setForm({
      title: routine.title,
      emoji: routine.emoji,
      time: routine.time || "07:30",
      period: routine.period,
      recurrenceDays: routine.recurrenceDays?.length
        ? routine.recurrenceDays
        : ALL_DAYS,
    })
  }

  const handleDelete = async (routine: RoutineItem) => {
    try {
      await onDelete(routine.id)
      if (editingId === routine.id) resetForm()
    } catch {
      // O dashboard ja mostra a mensagem de erro especifica.
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Repeat2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-800">
              Rotinas sem pontos
            </h2>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {childName
              ? `Checklist de ${childName}`
              : "Selecione uma crianca para gerenciar"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOpen(true)
            setEditingId(null)
            setForm(emptyForm)
          }}
          disabled={!selectedChildId}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus className="h-4 w-4" />
          Rotina
        </button>
      </div>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_96px_130px]">
            <SmartTaskInput
              title={form.title}
              emoji={form.emoji}
              onTitleChange={(title) => setForm((current) => ({ ...current, title }))}
              onEmojiChange={(emoji) => setForm((current) => ({ ...current, emoji }))}
              placeholder="Escovar dentes"
            />
            <input
              type="text"
              value={form.emoji}
              onChange={(event) =>
                setForm((current) => ({ ...current, emoji: event.target.value }))
              }
              className="h-12 rounded-2xl border-2 border-slate-200 bg-white px-3 text-center text-2xl outline-none transition-colors focus:border-emerald-400"
              aria-label="Emoji da rotina"
            />
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="time"
                value={form.time}
                onChange={(event) =>
                  setForm((current) => ({ ...current, time: event.target.value }))
                }
                className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-9 pr-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => {
                const active = selectedDays.has(day.key)
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    title={day.label}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-all ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-emerald-700"
                    }`}
                  >
                    {day.short}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setDays(SCHOOL_DAYS)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              >
                <School className="h-4 w-4" />
                Dias de aula
              </button>
              <button
                type="button"
                onClick={() => setDays(WEEKEND_DAYS)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              >
                <Umbrella className="h-4 w-4" />
                Fim de semana
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({ ...current, period: "morning" }))
                }
                className={`rounded-lg px-3 py-2 text-xs font-black transition-colors ${
                  form.period === "morning"
                    ? "bg-amber-500 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                Manha
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({ ...current, period: "evening" }))
                }
                className={`rounded-lg px-3 py-2 text-xs font-black transition-colors ${
                  form.period === "evening"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                Tarde/noite
              </button>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-700"
            >
              <Check className="h-4 w-4" />
              {editingId ? "Salvar" : "Cadastrar"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center justify-center rounded-xl bg-white px-4 py-3 text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              title="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {sortedRoutines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-bold text-slate-400 lg:col-span-2">
            Nenhuma rotina sem pontos cadastrada.
          </div>
        ) : (
          sortedRoutines.map((routine) => (
            <div
              key={routine.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                {routine.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-800">
                  {routine.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                  {routine.time && (
                    <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1">
                      <Clock className="h-3 w-3" />
                      {routine.time}
                    </span>
                  )}
                  <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDays(routine.recurrenceDays)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(routine)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sky-600 ring-1 ring-slate-200 transition-colors hover:bg-sky-50"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(routine)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-rose-600 ring-1 ring-slate-200 transition-colors hover:bg-rose-50"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.section>
  )
}
