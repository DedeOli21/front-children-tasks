"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { CalendarDays, CheckCircle2, Loader2, Repeat2, Star } from "lucide-react"
import {
  taskTemplatesApi,
  type RecurrenceDay,
  type RoutineItem,
  type TaskTemplate,
} from "@/lib/api"

const WEEK_DAYS: { key: RecurrenceDay; short: string }[] = [
  { key: "sunday", short: "D" },
  { key: "monday", short: "S" },
  { key: "tuesday", short: "T" },
  { key: "wednesday", short: "Q" },
  { key: "thursday", short: "Q" },
  { key: "friday", short: "S" },
  { key: "saturday", short: "S" },
]

const ALL_DAYS = WEEK_DAYS.map((day) => day.key)

type AgendaDay = {
  date: string
  dayNumber: string
  weekday: string
  recurrenceDay: RecurrenceDay
  isToday: boolean
}

function localDateValue(date: Date) {
  return new Intl.DateTimeFormat("en-CA").format(date)
}

function recurrenceDayFromDate(date: string): RecurrenceDay {
  const day = new Date(`${date}T12:00:00`).getDay()
  return WEEK_DAYS[day]?.key ?? "sunday"
}

function buildAgendaDays(): AgendaDay[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    const value = localDateValue(date)
    return {
      date: value,
      dayNumber: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
      weekday: date
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", ""),
      recurrenceDay: recurrenceDayFromDate(value),
      isToday: index === 0,
    }
  })
}

function routineMatchesDay(routine: RoutineItem, day: AgendaDay) {
  const days = routine.recurrenceDays?.length
    ? routine.recurrenceDays
    : ALL_DAYS
  return days.includes(day.recurrenceDay)
}

function templateMatchesDay(template: TaskTemplate, day: AgendaDay) {
  if (!template.active) return false
  if (template.taskType === "extra") return template.scheduledDate === day.date
  return template.recurrenceDays.includes(day.recurrenceDay)
}

interface WeeklyAgendaProps {
  selectedChildId: string | null
  routines: RoutineItem[]
  refreshKey?: number
}

export function WeeklyAgenda({
  selectedChildId,
  routines,
  refreshKey = 0,
}: WeeklyAgendaProps) {
  const days = useMemo(buildAgendaDays, [])
  const [selectedDate, setSelectedDate] = useState(days[0]?.date ?? "")
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSelectedDate(days[0]?.date ?? "")
  }, [days, selectedChildId])

  useEffect(() => {
    let ignore = false
    async function loadTemplates() {
      if (!selectedChildId) {
        setTemplates([])
        return
      }
      setIsLoading(true)
      try {
        const data = await taskTemplatesApi.list(selectedChildId)
        if (!ignore) setTemplates(data)
      } catch {
        if (!ignore) setTemplates([])
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    loadTemplates()
    return () => {
      ignore = true
    }
  }, [selectedChildId, refreshKey])

  const selectedDay =
    days.find((day) => day.date === selectedDate) ?? days[0]!
  const routinesForDay = routines.filter((routine) =>
    routineMatchesDay(routine, selectedDay),
  )
  const templatesForDay = templates.filter((template) =>
    templateMatchesDay(template, selectedDay),
  )

  const countForDay = (day: AgendaDay) =>
    routines.filter((routine) => routineMatchesDay(routine, day)).length +
    templates.filter((template) => templateMatchesDay(template, day)).length

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-black text-slate-800">Semana</h2>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Rotinas e combinados por dia
          </p>
        </div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const active = day.date === selectedDate
          const count = countForDay(day)
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={`relative flex min-h-[74px] flex-col items-center justify-center rounded-2xl border text-center transition-all ${
                active
                  ? "border-sky-500 bg-sky-50 text-sky-800 shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-sky-200"
              }`}
            >
              <span className="text-[10px] font-black uppercase">
                {day.weekday}
              </span>
              <span className="text-lg font-black">{day.dayNumber}</span>
              {day.isToday && (
                <span className="text-[10px] font-bold text-sky-600">Hoje</span>
              )}
              {count > 0 && (
                <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 space-y-2">
        {routinesForDay.length === 0 && templatesForDay.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">
            Nenhum item neste dia.
          </div>
        ) : (
          <>
            {routinesForDay.map((routine) => (
              <div
                key={`routine-${routine.id}`}
                className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                  {routine.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-800">
                    {routine.title}
                  </p>
                  <p className="text-xs font-bold text-emerald-700">
                    {routine.time ? `${routine.time} · ` : ""}Rotina sem pontos
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              </div>
            ))}

            {templatesForDay.map((template) => (
              <div
                key={`template-${template.id}`}
                className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                  {template.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-800">
                    {template.title}
                  </p>
                  <p className="flex items-center gap-1 text-xs font-bold text-amber-700">
                    {template.taskType === "fixed" ? (
                      <Repeat2 className="h-3 w-3" />
                    ) : (
                      <CalendarDays className="h-3 w-3" />
                    )}
                    Combinado com estrelas
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-black text-amber-700">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {template.rewardStars}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </motion.section>
  )
}
