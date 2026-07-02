"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Loader2,
  LogOut,
  Plus,
  Star,
  Flame,
  Copy,
  Check,
  Settings,
  ClipboardList,
  GraduationCap,
  Users,
  RotateCcw,
  Minus,
  X,
  CalendarDays,
} from "lucide-react"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { RoutinePlanner } from "@/components/parent/routine-planner"
import { PenaltyList } from "@/components/penalty-list"
import { RewardsShop } from "@/components/rewards-shop"
import { HistoryReport } from "@/components/admin/history-report"
import {
  childrenApi,
  tasksApi,
  penaltiesApi,
  rewardsApi,
  routinesApi,
  starsApi,
  mysteryBoxApi,
  type Child,
  type BehaviorReport,
  type Task,
  type Penalty,
  type Reward,
  type RoutineItem,
  type MysteryPrize,
} from "@/lib/api"

type ParentTab = "monitor" | "planner" | "reports" | "history" | "manage"

interface ParentDashboardProps {
  parentName: string
  onLogout: () => void
}

export function ParentDashboard({ parentName, onLogout }: ParentDashboardProps) {
  const [activeTab, setActiveTab] = useState<ParentTab>("monitor")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Crianças
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Dados da criança selecionada
  const [childTasks, setChildTasks] = useState<Task[]>([])
  const [reports, setReports] = useState<BehaviorReport[]>([])

  // Catálogos da família
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [routines, setRoutines] = useState<RoutineItem[]>([])
  const [mysteryPrizes, setMysteryPrizes] = useState<MysteryPrize[]>([])

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null

  const loadChildren = useCallback(async () => {
    const list = await childrenApi.list()
    setChildren(list)
    setSelectedChildId((current) => current && list.some((c) => c.id === current) ? current : (list[0]?.id ?? null))
    return list
  }, [])

  // Carga inicial: crianças + catálogos
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError("")
      try {
        const [, penaltiesData, rewardsData, routinesData, mysteryBoxConfig] = await Promise.all([
          loadChildren(),
          penaltiesApi.list(),
          rewardsApi.list(),
          routinesApi.list().catch(() => [] as RoutineItem[]),
          mysteryBoxApi.getConfig().catch(() => ({ cost: 5, prizes: [] as MysteryPrize[] })),
        ])
        setPenalties(penaltiesData)
        setRewards(rewardsData)
        setRoutines(routinesData)
        setMysteryPrizes(mysteryBoxConfig.prizes)
      } catch (err) {
        console.error("Erro ao carregar painel:", err)
        setError("Não foi possível carregar os dados. Verifique sua conexão.")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [loadChildren])

  // Dados por criança selecionada
  useEffect(() => {
    if (!selectedChildId) return
    tasksApi.list(selectedChildId).then(setChildTasks).catch(() => {
      setChildTasks([])
      toast.error("Não foi possível carregar as tarefas da criança selecionada.")
    })
    childrenApi.reports(selectedChildId).then(setReports).catch(() => setReports([]))
  }, [selectedChildId])

  // ============ AÇÕES SOBRE A CRIANÇA ============
  const updateChildStars = (childId: string, stars: number) => {
    setChildren((prev) => prev.map((c) => (c.id === childId ? { ...c, currentStars: stars } : c)))
  }

  const handleToggleTask = async (task: Task) => {
    if (!selectedChildId) return
    try {
      const result = task.completed
        ? await tasksApi.uncomplete(task.id, selectedChildId)
        : await tasksApi.complete(task.id, selectedChildId)
      setChildTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !task.completed } : t)))
      if (result.currentStars !== undefined) updateChildStars(selectedChildId, result.currentStars)
    } catch (err) {
      console.error("Erro ao alternar tarefa:", err)
      toast.error("Erro ao alternar tarefa. Tente novamente.")
    }
  }

  const handleResetDay = async () => {
    if (!selectedChildId) return
    try {
      await tasksApi.resetDay(selectedChildId)
      setChildTasks((prev) => prev.map((t) => ({ ...t, completed: false })))
    } catch (err) {
      console.error("Erro ao resetar dia:", err)
      toast.error("Erro ao resetar dia. Tente novamente.")
    }
  }

  const handleApplyPenalty = async (penaltyId: string) => {
    if (!selectedChildId) return
    try {
      const result = await penaltiesApi.apply(penaltyId, selectedChildId)
      if (result.currentStars !== undefined) updateChildStars(selectedChildId, result.currentStars)
    } catch (err) {
      console.error("Erro ao aplicar penalidade:", err)
      toast.error("Erro ao aplicar penalidade. Tente novamente.")
    }
  }

  const handleRedeemReward = async (rewardId: string) => {
    if (!selectedChildId || !selectedChild) return
    const reward = rewards.find((r) => r.id === rewardId)
    if (!reward || selectedChild.currentStars < reward.cost) return
    try {
      const result = await rewardsApi.redeem(rewardId, selectedChildId)
      if (result.currentStars !== undefined) updateChildStars(selectedChildId, result.currentStars)
    } catch (err) {
      console.error("Erro ao resgatar recompensa:", err)
      toast.error("Erro ao resgatar recompensa. Tente novamente.")
    }
  }

  const handleAdjustStars = async (delta: number) => {
    if (!selectedChildId || !selectedChild) return
    try {
      const result =
        delta > 0
          ? await starsApi.add(selectedChildId, delta, "Ajuste do responsável")
          : await starsApi.subtract(selectedChildId, -delta, "Ajuste do responsável")
      if (result.currentStars !== undefined) updateChildStars(selectedChildId, result.currentStars)
    } catch (err) {
      console.error("Erro ao ajustar estrelas:", err)
      toast.error("Erro ao ajustar estrelas. Tente novamente.")
    }
  }

  const handleCopyCode = () => {
    if (!selectedChild?.inviteCode) return
    navigator.clipboard.writeText(selectedChild.inviteCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // ============ HANDLERS DE CATÁLOGO (AdminDashboard) ============
  const handleTaskCreate = async (taskData: Omit<Task, "id" | "completed">) => {
    try {
      const created = await tasksApi.create(taskData)
      setChildTasks((prev) => [...prev, created])
    } catch (err) {
      console.error("Erro ao criar tarefa:", err)
      toast.error("Erro ao criar tarefa. Tente novamente.")
    }
  }

  const handleTaskUpdate = async (id: string, taskData: Partial<Task>) => {
    try {
      await tasksApi.update(id, taskData)
      setChildTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...taskData } : t)))
    } catch (err) {
      console.error("Erro ao atualizar tarefa:", err)
      toast.error("Erro ao atualizar tarefa. Tente novamente.")
    }
  }

  const handleTaskDelete = async (id: string) => {
    try {
      await tasksApi.delete(id)
      setChildTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error("Erro ao deletar tarefa:", err)
      toast.error("Erro ao deletar tarefa. Tente novamente.")
    }
  }

  const handlePenaltyCreate = async (penaltyData: Omit<Penalty, "id">) => {
    try {
      const created = await penaltiesApi.create(penaltyData)
      setPenalties((prev) => [...prev, created])
    } catch (err) {
      console.error("Erro ao criar penalidade:", err)
      toast.error("Erro ao criar penalidade. Tente novamente.")
    }
  }

  const handlePenaltyUpdate = async (id: string, penaltyData: Partial<Penalty>) => {
    try {
      await penaltiesApi.update(id, penaltyData)
      setPenalties((prev) => prev.map((p) => (p.id === id ? { ...p, ...penaltyData } : p)))
    } catch (err) {
      console.error("Erro ao atualizar penalidade:", err)
      toast.error("Erro ao atualizar penalidade. Tente novamente.")
    }
  }

  const handlePenaltyDelete = async (id: string) => {
    try {
      await penaltiesApi.delete(id)
      setPenalties((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error("Erro ao deletar penalidade:", err)
      toast.error("Erro ao deletar penalidade. Tente novamente.")
    }
  }

  const handleRewardCreate = async (rewardData: Omit<Reward, "id">) => {
    try {
      const created = await rewardsApi.create(rewardData)
      setRewards((prev) => [...prev, created])
    } catch (err) {
      console.error("Erro ao criar recompensa:", err)
      toast.error("Erro ao criar recompensa. Tente novamente.")
    }
  }

  const handleRewardUpdate = async (id: string, rewardData: Partial<Reward>) => {
    try {
      await rewardsApi.update(id, rewardData)
      setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, ...rewardData } : r)))
    } catch (err) {
      console.error("Erro ao atualizar recompensa:", err)
      toast.error("Erro ao atualizar recompensa. Tente novamente.")
    }
  }

  const handleRewardDelete = async (id: string) => {
    try {
      await rewardsApi.delete(id)
      setRewards((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error("Erro ao deletar recompensa:", err)
      toast.error("Erro ao deletar recompensa. Tente novamente.")
    }
  }

  const handleRoutineCreate = async (routineData: Omit<RoutineItem, "id">) => {
    try {
      const created = await routinesApi.create(routineData)
      setRoutines((prev) => [...prev, created].sort((a, b) => a.time.localeCompare(b.time)))
    } catch (err) {
      console.error("Erro ao criar rotina:", err)
      toast.error("Erro ao criar rotina. Tente novamente.")
    }
  }

  const handleRoutineUpdate = async (id: string, routineData: Partial<RoutineItem>) => {
    try {
      await routinesApi.update(id, routineData)
      setRoutines((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...routineData } : r)).sort((a, b) => a.time.localeCompare(b.time)),
      )
    } catch (err) {
      console.error("Erro ao atualizar rotina:", err)
      toast.error("Erro ao atualizar rotina. Tente novamente.")
    }
  }

  const handleRoutineDelete = async (id: string) => {
    try {
      await routinesApi.delete(id)
      setRoutines((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error("Erro ao deletar rotina:", err)
      toast.error("Erro ao deletar rotina. Tente novamente.")
    }
  }

  const handleMysteryPrizeCreate = async (prizeData: Omit<MysteryPrize, "id">) => {
    try {
      const created = await mysteryBoxApi.createPrize(prizeData)
      setMysteryPrizes((prev) => [...prev, created])
    } catch (err) {
      console.error("Erro ao criar prêmio:", err)
      toast.error("Erro ao criar prêmio. Tente novamente.")
    }
  }

  const handleMysteryPrizeUpdate = async (id: string, prizeData: Partial<MysteryPrize>) => {
    try {
      await mysteryBoxApi.updatePrize(id, prizeData)
      setMysteryPrizes((prev) => prev.map((p) => (p.id === id ? { ...p, ...prizeData } : p)))
    } catch (err) {
      console.error("Erro ao atualizar prêmio:", err)
      toast.error("Erro ao atualizar prêmio. Tente novamente.")
    }
  }

  const handleMysteryPrizeDelete = async (id: string) => {
    try {
      await mysteryBoxApi.deletePrize(id)
      setMysteryPrizes((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error("Erro ao deletar prêmio:", err)
      toast.error("Erro ao deletar prêmio. Tente novamente.")
    }
  }

  // ============ RENDER ============
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-slate-500" />
          <p className="text-lg font-semibold text-slate-500">Carregando painel...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <p className="text-center text-lg font-bold text-slate-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-slate-700 px-6 py-3 font-bold text-white shadow-lg"
        >
          Tentar novamente
        </button>
      </main>
    )
  }

  if (activeTab === "manage") {
    return (
      <AdminDashboard
        tasks={childTasks}
        penalties={penalties}
        rewards={rewards}
        routines={routines}
        mysteryPrizes={mysteryPrizes}
        onTaskCreate={handleTaskCreate}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        onPenaltyCreate={handlePenaltyCreate}
        onPenaltyUpdate={handlePenaltyUpdate}
        onPenaltyDelete={handlePenaltyDelete}
        onRewardCreate={handleRewardCreate}
        onRewardUpdate={handleRewardUpdate}
        onRewardDelete={handleRewardDelete}
        onRoutineCreate={handleRoutineCreate}
        onRoutineUpdate={handleRoutineUpdate}
        onRoutineDelete={handleRoutineDelete}
        onMysteryPrizeCreate={handleMysteryPrizeCreate}
        onMysteryPrizeUpdate={handleMysteryPrizeUpdate}
        onMysteryPrizeDelete={handleMysteryPrizeDelete}
        onBack={() => setActiveTab("monitor")}
        historyChildId={selectedChildId ?? undefined}
      />
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pb-10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-white drop-shadow-md">Painel da Família</h1>
            <p className="text-xs text-white/70">Olá, {parentName}</p>
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

      {/* Seletor de crianças */}
      <section className="px-4 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex min-w-[130px] shrink-0 flex-col rounded-2xl border-2 p-3 text-left shadow-md transition-all ${
                selectedChildId === child.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-transparent bg-white hover:border-emerald-200"
              }`}
            >
              <span className="text-sm font-black text-slate-700">{child.name}</span>
              <span className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-600">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {child.currentStars} estrelas
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                <Flame className="h-3 w-3" />
                {child.currentStreak} dias
              </span>
            </button>
          ))}
          <button
            onClick={() => setShowAddChild(true)}
            className="flex h-[88px] min-w-[110px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-400 transition-colors hover:border-emerald-400 hover:text-emerald-500"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs font-bold">Adicionar</span>
          </button>
        </div>
      </section>

      {/* Navegação */}
      <nav className="sticky top-16 z-30 mx-4 mt-2 grid grid-cols-5 gap-1 rounded-2xl bg-white p-2 shadow-lg">
        {(
          [
            { id: "monitor", label: "Acompanhar", icon: Users },
            { id: "planner", label: "Rotinas", icon: CalendarDays },
            { id: "reports", label: "Escola", icon: GraduationCap },
            { id: "history", label: "Histórico", icon: ClipboardList },
            { id: "manage", label: "Gerenciar", icon: Settings },
          ] as { id: ParentTab; label: string; icon: typeof Users }[]
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
              activeTab === id ? "bg-slate-700 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </nav>

      <div className="space-y-6 px-4 py-6">
        {children.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <p className="text-lg font-bold text-slate-700">Nenhuma criança cadastrada ainda</p>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre a primeira criança para começar a usar o quadro de recompensas.
            </p>
            <button
              onClick={() => setShowAddChild(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              Adicionar criança
            </button>
          </div>
        ) : activeTab === "monitor" && selectedChild ? (
          <>
            {/* Código de convite + ajustes rápidos */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-lg">
                <p className="text-xs font-bold uppercase text-slate-400">Código para o professor</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-xl bg-indigo-50 px-4 py-2 font-mono text-xl font-black tracking-widest text-indigo-600">
                    {selectedChild.inviteCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
                  >
                    {copiedCode ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    {copiedCode ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  O professor usa esse código para vincular {selectedChild.name} e enviar relatórios.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-lg">
                <p className="text-xs font-bold uppercase text-slate-400">Ajuste rápido de estrelas</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleAdjustStars(-1)}
                    disabled={selectedChild.currentStars === 0}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 transition-colors hover:bg-red-200 disabled:opacity-40"
                  >
                    <Minus className="h-5 w-5" strokeWidth={3} />
                  </button>
                  <span className="flex items-center gap-1 text-2xl font-black text-amber-500">
                    <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                    {selectedChild.currentStars}
                  </span>
                  <button
                    onClick={() => handleAdjustStars(1)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-colors hover:bg-emerald-200"
                  >
                    <Plus className="h-5 w-5" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tarefas de hoje */}
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-black text-slate-700">
                  Tarefas de hoje ({childTasks.filter((t) => t.completed).length}/{childTasks.length})
                </h2>
                <button
                  onClick={handleResetDay}
                  className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  <RotateCcw className="h-3 w-3" />
                  Resetar dia
                </button>
              </div>
              <div className="space-y-2">
                {childTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                      task.completed
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-100 bg-slate-50 hover:border-emerald-200"
                    }`}
                  >
                    <span className="text-2xl">{task.emoji}</span>
                    <span
                      className={`flex-1 font-semibold ${task.completed ? "text-emerald-700 line-through" : "text-slate-700"}`}
                    >
                      {task.title}
                    </span>
                    {task.completed && <Check className="h-5 w-5 text-emerald-500" strokeWidth={3} />}
                  </button>
                ))}
                {childTasks.length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-400">
                    Nenhuma tarefa cadastrada. Use a aba Gerenciar para criar.
                  </p>
                )}
              </div>
            </div>

            {/* Aplicar penalidade */}
            <PenaltyList penalties={penalties} onPenalty={(penaltyId) => handleApplyPenalty(penaltyId)} />

            {/* Resgatar recompensa em nome da criança */}
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <h2 className="mb-3 font-black text-slate-700">Resgatar recompensa para {selectedChild.name}</h2>
              <RewardsShop stars={selectedChild.currentStars} rewards={rewards} onRedeem={handleRedeemReward} />
            </div>
          </>
        ) : activeTab === "planner" ? (
          <RoutinePlanner
            children={children}
            selectedChildId={selectedChildId}
            onStarsChanged={updateChildStars}
          />
        ) : activeTab === "reports" && selectedChild ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-4 shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                <GraduationCap className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-indigo-700">Relatórios da escola</p>
                <p className="text-sm text-indigo-600/80">Registros diários enviados pelo professor</p>
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
                <p className="font-bold text-slate-600">Nenhum relatório ainda</p>
                <p className="mt-1 text-sm text-slate-400">
                  Compartilhe o código <strong>{selectedChild.inviteCode}</strong> com o professor para começar.
                </p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="rounded-2xl bg-white p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-700">
                        {new Date(`${report.date}T12:00:00`).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-slate-400">{report.teacherName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.rating != null && (
                        <span className="text-lg" title={`Avaliação: ${report.rating}/5`}>
                          {["😣", "😕", "🙂", "😄", "🤩"][report.rating - 1] ?? "🙂"}
                        </span>
                      )}
                      {report.starsAwarded > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                          +{report.starsAwarded} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{report.text}</p>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "history" && selectedChild ? (
          <HistoryReport childId={selectedChild.id} />
        ) : null}
      </div>

      {/* Modal: adicionar criança */}
      {showAddChild && (
        <AddChildModal
          onClose={() => setShowAddChild(false)}
          onCreated={async () => {
            setShowAddChild(false)
            const list = await loadChildren()
            if (list.length > 0) setSelectedChildId(list[list.length - 1].id)
          }}
        />
      )}
    </main>
  )
}

// ============ MODAL DE CADASTRO DE CRIANÇA ============
interface AddChildModalProps {
  onClose: () => void
  onCreated: () => void
}

function AddChildModal({ onClose, onCreated }: AddChildModalProps) {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSaving(true)
    try {
      await childrenApi.create({ name, username, password })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar criança")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-700">Nova criança</h2>
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
            placeholder="Nome da criança"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Usuário para login (ex: gabriel)"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            minLength={3}
            autoCapitalize="none"
            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Senha simples (mín. 4 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-black text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            Cadastrar
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-slate-400">
          A criança entra no app com esse usuário e senha, sem precisar de email.
        </p>
      </div>
    </div>
  )
}
