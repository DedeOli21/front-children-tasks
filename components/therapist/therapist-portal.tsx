"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Loader2,
  LogOut,
  Star,
  HeartHandshake,
  Sparkles,
  MessageCircle,
  NotebookPen,
  ClipboardList,
  Send,
  Flame,
  X,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  Gift,
} from "lucide-react"
import {
  therapistsApi,
  starsApi,
  observationsApi,
  type Student,
  type TherapistTimeline,
  type TimelineEvent,
  type StarRequest,
} from "@/lib/api"
import { MessagesPanel } from "@/components/shared/messages-panel"
import { NotificationBell } from "@/components/shared/notification-bell"
import { ReportExport } from "@/components/shared/report-export"

type TherapistTab = "timeline" | "messages" | "suggestions"

interface TherapistPortalProps {
  therapistName: string
  onLogout: () => void
}

const REQUEST_STATUS_LABELS: Record<StarRequest["status"], { label: string; className: string }> = {
  pending: { label: "Aguardando responsável", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprovada ⭐", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Recusada", className: "bg-red-100 text-red-600" },
}

// Dashboard da terapeuta: timeline diária, bonificação com justificativa,
// notas de observação e mensagens com o professor.
export function TherapistPortal({ therapistName, onLogout }: TherapistPortalProps) {
  const [tab, setTab] = useState<TherapistTab>("timeline")
  const [patients, setPatients] = useState<Student[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [timeline, setTimeline] = useState<TherapistTimeline | null>(null)
  const [suggestions, setSuggestions] = useState<StarRequest[]>([])
  const [showBonusModal, setShowBonusModal] = useState(false)

  // Nota rápida de observação
  const [noteText, setNoteText] = useState("")
  const [noteType, setNoteType] = useState<"clinical" | "behavioral">("clinical")
  const [isSavingNote, setIsSavingNote] = useState(false)

  const selected = patients.find((p) => p.id === selectedId) ?? null

  useEffect(() => {
    therapistsApi
      .patients()
      .then((list) => {
        setPatients(list)
        setSelectedId(list[0]?.id ?? null)
      })
      .catch(() => toast.error("Não foi possível carregar seus pacientes."))
      .finally(() => setIsLoading(false))
  }, [])

  const loadTimeline = useCallback(() => {
    if (!selectedId) {
      setTimeline(null)
      return
    }
    therapistsApi
      .timeline(selectedId)
      .then(setTimeline)
      .catch(() => setTimeline(null))
  }, [selectedId])

  useEffect(() => {
    loadTimeline()
  }, [loadTimeline])

  useEffect(() => {
    if (tab === "suggestions") {
      starsApi.listMyRequests().then(setSuggestions).catch(() => setSuggestions([]))
    }
  }, [tab])

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    setIsSavingNote(true)
    try {
      await observationsApi.create({ childId: selectedId, text: noteText, type: noteType })
      setNoteText("")
      toast.success("Observação registrada 📝")
      loadTimeline()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar a nota")
    } finally {
      setIsSavingNote(false)
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-purple-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          <p className="text-lg font-semibold text-purple-500">Carregando portal...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-slate-50 to-white pb-10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-white" />
            <div>
              <h1 className="text-lg font-black text-white drop-shadow-md">Portal da Terapeuta</h1>
              <p className="text-xs text-white/70">Olá, {therapistName}</p>
            </div>
          </div>
          <NotificationBell />
          <button
            onClick={onLogout}
            className="flex items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/30"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Pacientes */}
      <section className="px-4 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => setSelectedId(patient.id)}
              className={`flex min-w-[140px] shrink-0 flex-col rounded-2xl border-2 p-3 text-left shadow-md transition-all ${
                selectedId === patient.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-transparent bg-white hover:border-purple-200"
              }`}
            >
              <span className="text-sm font-black text-slate-700">{patient.name}</span>
              <span className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-600">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {patient.currentStars} estrelas
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                <Flame className="h-3 w-3" />
                {patient.currentStreak} dias
              </span>
            </button>
          ))}
          {patients.length === 0 && (
            <div className="w-full rounded-2xl bg-white p-6 text-center shadow-lg">
              <p className="font-bold text-slate-600">Nenhum paciente vinculado</p>
              <p className="mt-1 text-sm text-slate-400">
                Peça ao responsável para vincular você pelo painel da família (aba Acompanhar).
              </p>
            </div>
          )}
        </div>
      </section>

      {patients.length > 0 && (
        <>
          {/* Abas */}
          <nav className="mx-4 mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-white p-2 shadow-lg">
            {(
              [
                { id: "timeline", label: "Timeline", icon: ClipboardList },
                { id: "messages", label: "Mensagens", icon: MessageCircle },
                { id: "suggestions", label: "Sugestões", icon: Sparkles },
              ] as { id: TherapistTab; label: string; icon: typeof ClipboardList }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 font-bold transition-all ${
                  tab === id ? "bg-purple-500 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </nav>

          <div className="space-y-4 px-4 py-4">
            {tab === "timeline" && selected && (
              <>
                {/* Ação principal: bonificar */}
                <button
                  onClick={() => setShowBonusModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 font-black text-white shadow-lg transition-transform hover:scale-[1.01]"
                >
                  <Sparkles className="h-5 w-5" />
                  Bonificar {selected.name}
                </button>

                {/* Exportação do relatório compilado */}
                <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-lg">
                  <p className="text-sm font-bold text-slate-600">Relatório dos últimos 30 dias</p>
                  <ReportExport childId={selected.id} childName={selected.name} />
                </div>

                {/* Nota rápida */}
                <form onSubmit={handleSaveNote} className="rounded-2xl bg-white p-4 shadow-lg">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <NotebookPen className="h-4 w-4 text-purple-500" />
                      <h3 className="text-sm font-black text-slate-700">Nota de observação</h3>
                    </div>
                    <div className="flex gap-1">
                      {(["clinical", "behavioral"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNoteType(type)}
                          className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                            noteType === type ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {type === "clinical" ? "Clínica" : "Comportamental"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    required
                    minLength={5}
                    rows={2}
                    placeholder="Registro da sessão (visível apenas para os adultos)"
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 focus:border-purple-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSavingNote}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 py-2 text-sm font-black text-white shadow disabled:opacity-50"
                  >
                    {isSavingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
                    Registrar
                  </button>
                </form>

                {/* Timeline diária consolidada */}
                <div className="rounded-2xl bg-white p-4 shadow-lg">
                  <h3 className="mb-3 font-black text-slate-700">Linha do tempo (casa + escola)</h3>
                  {!timeline || timeline.events.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">Nenhum evento nos últimos dias.</p>
                  ) : (
                    <div className="max-h-[28rem] space-y-2 overflow-y-auto">
                      {timeline.events.map((event, index) => (
                        <TimelineEventCard key={index} event={event} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === "messages" && selected && <MessagesPanel childId={selected.id} childName={selected.name} />}

            {tab === "suggestions" && (
              <div className="rounded-2xl bg-white p-4 shadow-lg">
                <h3 className="mb-3 font-black text-slate-700">Minhas sugestões de bonificação</h3>
                {suggestions.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">Nenhuma sugestão enviada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {suggestions.map((request) => {
                      const status = REQUEST_STATUS_LABELS[request.status]
                      return (
                        <div key={request.id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-slate-700">
                              +{request.amount} ⭐ · {request.childName}
                            </p>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${status.className}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{request.reason}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {showBonusModal && selected && (
        <BonusModal
          child={selected}
          onClose={() => setShowBonusModal(false)}
          onSent={() => {
            setShowBonusModal(false)
            toast.success("Bonificação enviada! Aguardando aprovação do responsável 💜")
          }}
        />
      )}
    </main>
  )
}

// ============ EVENTO DA TIMELINE ============
function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const when = new Date(event.at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  if (event.kind === "school_report") {
    return (
      <div className="rounded-xl border-l-4 border-indigo-400 bg-indigo-50 p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
          <GraduationCap className="h-3.5 w-3.5" />
          Relatório da escola · {event.authorName} · {when}
        </div>
        <p className="mt-1 text-sm text-slate-600">{event.text}</p>
        {(event.starsAwarded ?? 0) > 0 && (
          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
            +{event.starsAwarded} ⭐
          </span>
        )}
      </div>
    )
  }

  if (event.kind === "observation") {
    return (
      <div className="rounded-xl border-l-4 border-purple-400 bg-purple-50 p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-600">
          <NotebookPen className="h-3.5 w-3.5" />
          {event.type === "clinical" ? "Nota clínica" : event.type === "behavioral" ? "Nota comportamental" : "Nota"} ·{" "}
          {event.authorName} · {when}
        </div>
        <p className="mt-1 text-sm text-slate-600">{event.text}</p>
      </div>
    )
  }

  const isPositive = (event.starsChange ?? 0) > 0
  const isPenalty = event.type === "penalty"
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
      {isPenalty ? (
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
      ) : isPositive ? (
        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <Gift className="h-4 w-4 shrink-0 text-amber-500" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-700">{event.description}</p>
        <p className="text-[11px] text-slate-400">{when}</p>
      </div>
      {event.starsChange !== 0 && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
          }`}
        >
          {isPositive ? "+" : ""}
          {event.starsChange} ⭐
        </span>
      )}
    </div>
  )
}

// ============ MODAL DE BONIFICAÇÃO ============
function BonusModal({
  child,
  onClose,
  onSent,
}: {
  child: Student
  onClose: () => void
  onSent: () => void
}) {
  const [amount, setAmount] = useState(1)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSending(true)
    try {
      await starsApi.suggest({ childId: child.id, amount, reason })
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar bonificação")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-700">Bonificar {child.name}</h2>
          <button onClick={onClose} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-3 text-center text-sm font-semibold text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="rounded-xl bg-amber-50 p-3">
            <p className="text-sm font-bold text-amber-700">Estrelas sugeridas:</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value)}
                  className={`h-10 flex-1 rounded-lg text-sm font-black transition-all ${
                    amount === value ? "bg-amber-400 text-white shadow" : "bg-white text-amber-600 hover:bg-amber-100"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={5}
            rows={3}
            placeholder="Motivo (obrigatório): o que a criança fez de bom na sessão?"
            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 focus:border-amber-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={isSending}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-black text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            Enviar para aprovação
          </button>
          <p className="text-center text-xs text-slate-400">
            As estrelas só entram no saldo depois que o responsável aprovar.
          </p>
        </form>
      </div>
    </div>
  )
}
