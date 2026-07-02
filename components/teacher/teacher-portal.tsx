"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Loader2,
  LogOut,
  Plus,
  Star,
  GraduationCap,
  UserPlus,
  Send,
  ClipboardList,
  X,
} from "lucide-react"
import { teacherApi, type Student, type BehaviorReport } from "@/lib/api"

const RATING_EMOJIS = ["😣", "😕", "🙂", "😄", "🤩"]
const RATING_LABELS = ["Dia difícil", "Instável", "Normal", "Bom dia", "Excelente"]

interface TeacherPortalProps {
  teacherName: string
  onLogout: () => void
}

// Portal do professor: vincula alunos por código, concede estrelas de
// desempenho e escreve relatórios comportamentais diários.
export function TeacherPortal({ teacherName, onLogout }: TeacherPortalProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [reports, setReports] = useState<BehaviorReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [feedback, setFeedback] = useState("")

  // Formulário de relatório
  const [reportText, setReportText] = useState("")
  const [rating, setRating] = useState<number | null>(null)
  const [starsToAward, setStarsToAward] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [formError, setFormError] = useState("")

  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null

  const loadStudents = useCallback(async () => {
    try {
      const list = await teacherApi.listStudents()
      setStudents(list)
      setSelectedStudentId((current) =>
        current && list.some((s) => s.id === current) ? current : (list[0]?.id ?? null),
      )
    } catch (err) {
      console.error("Erro ao carregar alunos:", err)
      toast.error("Não foi possível carregar seus alunos. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  useEffect(() => {
    if (!selectedStudentId) {
      setReports([])
      return
    }
    teacherApi.listReports(selectedStudentId).then(setReports).catch(() => setReports([]))
  }, [selectedStudentId])

  const showFeedback = (message: string) => {
    setFeedback(message)
    setTimeout(() => setFeedback(""), 3000)
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) return
    setFormError("")
    setIsSending(true)
    try {
      const result = await teacherApi.createReport(selectedStudentId, {
        text: reportText,
        rating: rating ?? undefined,
        starsAwarded: starsToAward > 0 ? starsToAward : undefined,
      })
      setReports((prev) => [
        { ...result, createdAt: new Date().toISOString() },
        ...prev,
      ])
      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudentId ? { ...s, currentStars: result.currentStars } : s)),
      )
      setReportText("")
      setRating(null)
      setStarsToAward(0)
      showFeedback("Relatório enviado para a família! ✅")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao enviar relatório")
    } finally {
      setIsSending(false)
    }
  }

  const handleQuickStar = async (amount: number) => {
    if (!selectedStudentId) return
    try {
      const result = await teacherApi.giveStars(selectedStudentId, {
        amount,
        reason: "Bom desempenho na aula",
      })
      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudentId ? { ...s, currentStars: result.currentStars } : s)),
      )
      showFeedback(`+${amount} estrela(s) para ${selectedStudent?.name}! ⭐`)
    } catch (err) {
      console.error("Erro ao dar estrelas:", err)
      toast.error(err instanceof Error ? err.message : "Não foi possível dar estrelas.")
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-lg font-semibold text-indigo-500">Carregando portal...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-white pb-10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-white" />
            <div>
              <h1 className="text-lg font-black text-white drop-shadow-md">Portal do Professor</h1>
              <p className="text-xs text-white/70">Olá, {teacherName}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/30"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      {feedback && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white shadow-xl">
          {feedback}
        </div>
      )}

      {/* Seletor de alunos */}
      <section className="px-4 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className={`flex min-w-[130px] shrink-0 flex-col rounded-2xl border-2 p-3 text-left shadow-md transition-all ${
                selectedStudentId === student.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-transparent bg-white hover:border-indigo-200"
              }`}
            >
              <span className="text-sm font-black text-slate-700">{student.name}</span>
              <span className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-600">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {student.currentStars} estrelas
              </span>
            </button>
          ))}
          <button
            onClick={() => setShowAddStudent(true)}
            className="flex h-[72px] min-w-[110px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-indigo-300 bg-white text-indigo-400 transition-colors hover:border-indigo-500 hover:text-indigo-600"
          >
            <UserPlus className="h-5 w-5" />
            <span className="text-xs font-bold">Vincular aluno</span>
          </button>
        </div>
      </section>

      <div className="space-y-6 px-4 py-4">
        {students.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <GraduationCap className="mx-auto h-10 w-10 text-indigo-300" />
            <p className="mt-2 text-lg font-bold text-slate-700">Nenhum aluno vinculado</p>
            <p className="mt-1 text-sm text-slate-500">
              Peça ao responsável o código de convite da criança e vincule seu primeiro aluno.
            </p>
            <button
              onClick={() => setShowAddStudent(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
            >
              <UserPlus className="h-5 w-5" />
              Vincular aluno
            </button>
          </div>
        ) : selectedStudent ? (
          <>
            {/* Estrelas rápidas */}
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <p className="text-xs font-bold uppercase text-slate-400">
                Estrelas de desempenho para {selectedStudent.name}
              </p>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickStar(amount)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-amber-100 py-3 font-black text-amber-700 transition-all hover:bg-amber-200 active:scale-95"
                  >
                    +{amount} <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Relatório do dia */}
            <form onSubmit={handleSubmitReport} className="rounded-2xl bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                <h2 className="font-black text-slate-700">Relatório do dia</h2>
              </div>

              {formError && (
                <div className="mb-3 rounded-xl bg-red-100 p-3 text-center text-sm font-semibold text-red-600">
                  {formError}
                </div>
              )}

              {/* Avaliação do dia */}
              <p className="text-xs font-bold uppercase text-slate-400">Como foi o dia?</p>
              <div className="mt-2 grid grid-cols-5 gap-1">
                {RATING_EMOJIS.map((emoji, index) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setRating(rating === index + 1 ? null : index + 1)}
                    title={RATING_LABELS[index]}
                    className={`flex flex-col items-center rounded-xl border-2 py-2 transition-all ${
                      rating === index + 1
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-100 bg-slate-50 hover:border-indigo-200"
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="mt-1 text-[9px] font-bold text-slate-500">{RATING_LABELS[index]}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                required
                rows={4}
                placeholder={`Como foi o dia de ${selectedStudent.name}? Comportamento, participação, convivência...`}
                className="mt-3 w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:outline-none"
              />

              {/* Estrelas junto com o relatório */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 p-3">
                <p className="text-sm font-bold text-amber-700">Estrelas pelo dia:</p>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setStarsToAward(amount)}
                      className={`h-9 w-9 rounded-lg text-sm font-black transition-all ${
                        starsToAward === amount
                          ? "bg-amber-400 text-white shadow"
                          : "bg-white text-amber-600 hover:bg-amber-100"
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-black text-white shadow-lg transition-transform hover:scale-[1.01] disabled:opacity-50"
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Enviar para a família
              </button>
            </form>

            {/* Relatórios anteriores */}
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <h2 className="mb-3 font-black text-slate-700">Relatórios anteriores</h2>
              {reports.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">Nenhum relatório enviado ainda.</p>
              ) : (
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {reports.map((report) => (
                    <div key={report.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-slate-700">
                          {new Date(`${report.date}T12:00:00`).toLocaleDateString("pt-BR")}
                        </p>
                        <div className="flex items-center gap-2">
                          {report.rating != null && (
                            <span className="text-lg">{RATING_EMOJIS[report.rating - 1] ?? "🙂"}</span>
                          )}
                          {report.starsAwarded > 0 && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                              +{report.starsAwarded} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{report.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Modal: vincular aluno */}
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onLinked={(student) => {
            setShowAddStudent(false)
            setStudents((prev) => [...prev, student])
            setSelectedStudentId(student.id)
          }}
        />
      )}
    </main>
  )
}

// ============ MODAL DE VÍNCULO DE ALUNO ============
interface AddStudentModalProps {
  onClose: () => void
  onLinked: (student: Student) => void
}

function AddStudentModal({ onClose, onLinked }: AddStudentModalProps) {
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSaving(true)
    try {
      const student = await teacherApi.addStudent(inviteCode.trim().toUpperCase())
      onLinked(student)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao vincular aluno")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-700">Vincular aluno</h2>
          <button onClick={onClose} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-3 text-center text-sm font-semibold text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Código de convite (ex: AB12CD)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            maxLength={8}
            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-xl font-black tracking-widest text-indigo-600 focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-black text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            Vincular
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-slate-400">
          O código aparece no painel do responsável, na aba Acompanhar.
        </p>
      </div>
    </div>
  )
}
