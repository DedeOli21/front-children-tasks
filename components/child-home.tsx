"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { StarPanel } from "@/components/star-panel"
import { TaskList } from "@/components/task-list"
import { RewardsShop } from "@/components/rewards-shop"
import { PenaltyList } from "@/components/penalty-list"
import { RoutineSchedule } from "@/components/routine-schedule"
import { Confetti } from "@/components/confetti"
import { StreakDisplay } from "@/components/streak-display"
import { MysteryBox } from "@/components/mystery-box"
import { Star, Gift, AlertTriangle, Clock, Loader2, LogOut, Package, Rocket, Check, Play, Timer, XCircle } from "lucide-react"
import {
  starsApi,
  tasksApi,
  penaltiesApi,
  rewardsApi,
  routinesApi,
  streaksApi,
  mysteryBoxApi,
  missionsApi,
  focusApi,
  goalsApi,
  type Task,
  type Penalty,
  type Reward,
  type RoutineItem,
  type MysteryPrize,
  type Mission,
  type StarRequest,
  type StreakData,
  type FocusSession,
  type FamilyGoal,
} from "@/lib/api"

type ChildTab = "tasks" | "routine" | "penalties" | "rewards" | "mystery"

interface ChildHomeProps {
  childName: string
  onLogout: () => void
}

// Visão gamificada da criança: completar tarefas, ver rotina,
// resgatar recompensas e abrir a caixa surpresa.
export function ChildHome({ childName, onLogout }: ChildHomeProps) {
  const [activeTab, setActiveTab] = useState<ChildTab>("tasks")
  const [stars, setStars] = useState(0)
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [freezes, setFreezes] = useState(0)
  const [plant, setPlant] = useState<StreakData["plant"] | null>(null)
  const [pendingBonuses, setPendingBonuses] = useState<StarRequest[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [tasks, setTasks] = useState<Task[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [routines, setRoutines] = useState<RoutineItem[]>([])
  const [goals, setGoals] = useState<FamilyGoal[]>([])
  const [mysteryPrizes, setMysteryPrizes] = useState<MysteryPrize[]>([])
  const [mysteryBoxCost, setMysteryBoxCost] = useState(5)
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null)
  const [focusMissionTitle, setFocusMissionTitle] = useState("")
  const [focusRemainingSeconds, setFocusRemainingSeconds] = useState(0)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const [starsData, tasksData, missionsData, penaltiesData, rewardsData, routinesData, goalsData, streakData, mysteryBoxConfig, bonusesData] =
        await Promise.all([
          starsApi.getBalance(),
          tasksApi.list(),
          missionsApi.forDay().catch(() => [] as Mission[]),
          penaltiesApi.list(),
          rewardsApi.list(),
          routinesApi.list(),
          goalsApi.list().catch(() => [] as FamilyGoal[]),
          streaksApi.get().catch(() => null as StreakData | null),
          mysteryBoxApi.getConfig().catch(() => ({ cost: 5, prizes: [] as MysteryPrize[] })),
          starsApi.listRequests().catch(() => [] as StarRequest[]),
        ])

      setStars(starsData.stars ?? 0)
      setTasks(tasksData)
      setMissions(missionsData)
      setPenalties(penaltiesData)
      setRewards(rewardsData)
      setRoutines(routinesData)
      setGoals(goalsData)
      setStreak(streakData?.currentStreak ?? 0)
      setLongestStreak(streakData?.longestStreak ?? 0)
      setFreezes(streakData?.streakFreezes ?? 0)
      setPlant(streakData?.plant ?? null)
      setPendingBonuses(bonusesData)
      setMysteryPrizes(mysteryBoxConfig.prizes)
      setMysteryBoxCost(mysteryBoxConfig.cost || 5)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!focusSession || focusSession.status !== "running" || focusRemainingSeconds <= 0) return

    const timer = window.setInterval(() => {
      setFocusRemainingSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [focusRemainingSeconds, focusSession])

  const celebrate = (duration = 2000) => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), duration)
  }

  const handleTaskComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.completed) return

    // Atualização otimista com rollback em caso de erro.
    // As estrelas só chegam quando o responsável aprovar.
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true, status: "completed" } : t)),
    )
    celebrate()

    try {
      const result = await tasksApi.complete(taskId)
      if (result.streak !== undefined) setStreak(result.streak)
      toast.info("Tarefa enviada! Aguardando o chefe aprovar 🕐")
    } catch (error) {
      console.error("Erro ao completar tarefa:", error)
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: false, status: "pending" } : t)),
      )
      toast.error("Não foi possível completar a tarefa. Tente novamente.")
    }
  }

  const handleMissionComplete = async (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId)
    if (!mission || mission.status !== "scheduled") return

    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status: "completed" } : m)),
    )
    celebrate()

    try {
      await missionsApi.complete(missionId)
      toast.info("Missão enviada! Aguardando o chefe aprovar 🕐")
    } catch (error) {
      console.error("Erro ao concluir missão:", error)
      setMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, status: "scheduled" } : m)),
      )
      toast.error("Não foi possível concluir a missão. Tente novamente.")
    }
  }

  const handleRewardRedeem = async (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId)
    if (!reward || stars < reward.cost) return

    setStars((prev) => prev - reward.cost)
    celebrate(3000)

    try {
      const result = await rewardsApi.redeem(rewardId)
      if (result.currentStars !== undefined) setStars(result.currentStars)
      if (result.streakFreezes !== undefined) setFreezes(result.streakFreezes)
      if (reward.kind === "streak_freeze") toast.success("Regador Mágico guardado para proteger sua plantinha!")
    } catch (error) {
      console.error("Erro ao resgatar recompensa:", error)
      setStars((prev) => prev + reward.cost)
      toast.error(error instanceof Error ? error.message : "Não foi possível resgatar a recompensa.")
    }
  }

  const handleMysteryBoxOpen = async (): Promise<MysteryPrize> => {
    try {
      const result = await mysteryBoxApi.open()
      setStars(result.newBalance)
      celebrate(3000)
      return result.prize
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir a caixa surpresa.")
      throw error
    }
  }

  const handleGoalDeposit = async (goalId: string, amount: number) => {
    try {
      const result = await goalsApi.deposit(goalId, { amount })
      setStars(result.currentStars)
      setGoals((prev) => prev.map((goal) => (goal.id === result.goal.id ? result.goal : goal)))
      toast.success(result.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível depositar no cofrinho.")
    }
  }

  const handleStartFocus = async (mission: Mission) => {
    if (mission.status !== "scheduled") return
    try {
      const session = await focusApi.start({ missionId: mission.id, durationMinutes: 15 })
      setFocusSession(session)
      setFocusMissionTitle(mission.title)
      setFocusRemainingSeconds(session.durationMinutes * 60)
      toast.success("Modo Foco iniciado!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o foco.")
    }
  }

  const handleCompleteFocus = async () => {
    if (!focusSession) return
    try {
      const session = await focusApi.complete(focusSession.id)
      setFocusSession(session)
      setFocusRemainingSeconds(0)
      toast.success(session.message ?? "Foco concluído!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir o foco.")
    }
  }

  const handleAbandonFocus = async () => {
    if (!focusSession) return
    try {
      const session = await focusApi.abandon(focusSession.id)
      setFocusSession(session)
      setFocusRemainingSeconds(0)
      toast.info(session.message ?? "Sessão interrompida.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível encerrar o foco.")
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold text-muted-foreground">Carregando...</p>
        </div>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 px-4">
        <p className="text-center text-lg font-bold text-foreground">Não foi possível carregar seus dados 😢</p>
        <button
          onClick={loadData}
          className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105"
        >
          Tentar novamente
        </button>
        <button onClick={onLogout} className="text-sm font-semibold text-muted-foreground underline">
          Sair
        </button>
      </main>
    )
  }

  const completedTasks = tasks.filter((t) => t.completed).map((t) => t.id)
  const focusMinutes = Math.floor(focusRemainingSeconds / 60)
  const focusSeconds = focusRemainingSeconds % 60

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50">
      {showConfetti && <Confetti />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-emerald-500 px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black text-primary-foreground drop-shadow-md">
            Quadro de Recompensas de {childName}
          </h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/30"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Star Panel and Streak */}
      <div className="space-y-4 px-4 py-6">
        <StarPanel stars={stars} />
        <StreakDisplay streak={streak} longestStreak={longestStreak} freezes={freezes} plant={plant ?? undefined} />

        {focusSession?.status === "running" && (
          <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <Timer className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-white/70">Modo Foco</p>
                  <p className="font-black">{focusMissionTitle || "Missão acadêmica"}</p>
                </div>
              </div>
              <div className="rounded-xl bg-white/20 px-3 py-2 font-mono text-2xl font-black">
                {String(focusMinutes).padStart(2, "0")}:{String(focusSeconds).padStart(2, "0")}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleAbandonFocus}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white/15 py-2 text-sm font-black text-white hover:bg-white/25"
              >
                <XCircle className="h-4 w-4" />
                Pausar
              </button>
              <button
                onClick={handleCompleteFocus}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white py-2 text-sm font-black text-indigo-700"
              >
                <Check className="h-4 w-4" />
                Concluir
              </button>
            </div>
          </div>
        )}

        {/* Estrelas da terapeuta aguardando o chefe aprovar */}
        {pendingBonuses.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-purple-100 to-fuchsia-100 p-4 shadow-lg ring-2 ring-purple-200">
            <p className="font-black text-purple-700">
              💜 Você recebeu {pendingBonuses.reduce((sum, b) => sum + b.amount, 0)} estrela(s) da sua
              terapeuta!
            </p>
            <p className="mt-1 text-sm font-semibold text-purple-500">Aguardando o chefe aprovar! 🕐</p>
          </div>
        )}
      </div>

      <nav className="sticky top-16 z-30 mx-4 grid grid-cols-5 gap-1 rounded-2xl bg-card p-2 shadow-lg">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "tasks"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Star className="h-4 w-4" />
          <span className="text-[10px]">Tarefas</span>
        </button>
        <button
          onClick={() => setActiveTab("routine")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "routine"
              ? "bg-indigo-500 text-white shadow-md"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span className="text-[10px]">Rotina</span>
        </button>
        <button
          onClick={() => setActiveTab("penalties")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "penalties"
              ? "bg-red-500 text-white shadow-md"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="text-[10px]">Perdas</span>
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "rewards"
              ? "bg-accent text-accent-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Gift className="h-4 w-4" />
          <span className="text-[10px]">Loja</span>
        </button>
        <button
          onClick={() => setActiveTab("mystery")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "mystery"
              ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Package className="h-4 w-4" />
          <span className="text-[10px]">Caixa</span>
        </button>
      </nav>

      <div className="px-4 py-6">
        {activeTab === "tasks" ? (
          <div className="space-y-6">
            <TaskList
              tasks={tasks}
              completedTasks={completedTasks}
              onTaskComplete={handleTaskComplete}
              childName={childName}
            />

            {/* Missões da escola alocadas para hoje */}
            {missions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                    <Rocket className="h-6 w-6 text-violet-500" />
                  </div>
                  <h2 className="text-lg font-black text-foreground">Missões da Escola</h2>
                </div>
                {missions.map((mission) => {
                  const isDone = mission.status !== "scheduled"
                  const isApproved = mission.status === "approved"
                  return (
                    <div
                      key={mission.id}
                      onClick={() => handleMissionComplete(mission.id)}
                      role="button"
                      tabIndex={isDone ? -1 : 0}
                      className={`w-full rounded-2xl p-4 text-left shadow-lg transition-all duration-300 ${
                        isApproved
                          ? "bg-gradient-to-r from-emerald-100 to-green-100 ring-2 ring-primary"
                          : isDone
                            ? "bg-amber-50 ring-2 ring-amber-300"
                            : "bg-card hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                      }`}
                      onKeyDown={(event) => {
                        if (!isDone && (event.key === "Enter" || event.key === " ")) handleMissionComplete(mission.id)
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 ${
                            isApproved
                              ? "border-primary bg-primary"
                              : isDone
                                ? "border-amber-300 bg-amber-100"
                                : "border-violet-200 bg-violet-50"
                          }`}
                        >
                          {isApproved ? (
                            <Check className="h-8 w-8 text-white" strokeWidth={3} />
                          ) : (
                            <span className="text-3xl">{mission.iconEmoji}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-lg font-bold ${isApproved ? "text-primary" : "text-foreground"}`}>
                            {mission.title}
                          </p>
                          {mission.description && !isDone && (
                            <p className="text-sm text-muted-foreground">{mission.description}</p>
                          )}
                          <p
                            className={`text-sm ${
                              isDone && !isApproved ? "font-semibold text-amber-600" : "text-muted-foreground"
                            }`}
                          >
                            {isApproved
                              ? `Aprovada! +${mission.starsReward} estrela(s)`
                              : isDone
                                ? "Aguardando o chefe aprovar! 🕐"
                                : `Missão de ${mission.teacherName ?? "professor(a)"} · vale ${mission.starsReward}⭐`}
                          </p>
                        </div>
                        {isDone ? (
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md ${
                              isApproved ? "bg-yellow-400" : "bg-amber-200"
                            }`}
                          >
                            <span className="text-xl">{isApproved ? "⭐" : "🕐"}</span>
                          </div>
                        ) : (
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              handleStartFocus(mission)
                            }}
                            className="flex shrink-0 items-center gap-1 rounded-xl bg-violet-100 px-3 py-2 text-sm font-black text-violet-700 transition-colors hover:bg-violet-200"
                          >
                            <Play className="h-4 w-4" />
                            Foco
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : activeTab === "routine" ? (
          <RoutineSchedule routines={routines} />
        ) : activeTab === "penalties" ? (
          <PenaltyList penalties={penalties} readOnly />
        ) : activeTab === "rewards" ? (
          <div className="space-y-5">
            <RewardsShop stars={stars} rewards={rewards} onRedeem={handleRewardRedeem} />
            <ChildGoalsPanel goals={goals} stars={stars} onDeposit={handleGoalDeposit} />
          </div>
        ) : (
          <MysteryBox stars={stars} cost={mysteryBoxCost} prizes={mysteryPrizes} onOpen={handleMysteryBoxOpen} />
        )}
      </div>

      {/* Bottom padding for mobile */}
      <div className="h-8" />
    </main>
  )
}

function ChildGoalsPanel({
  goals,
  stars,
  onDeposit,
}: {
  goals: FamilyGoal[]
  stars: number
  onDeposit: (goalId: string, amount: number) => void
}) {
  const activeGoals = goals.filter((goal) => goal.status === "active")
  const [amountByGoal, setAmountByGoal] = useState<Record<string, string>>({})

  if (activeGoals.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">🐷</div>
        <div>
          <p className="text-lg font-black text-emerald-700">Cofrinho da Família</p>
          <p className="text-sm font-semibold text-emerald-600/80">Ajude todo mundo a alcançar uma meta!</p>
        </div>
      </div>

      {activeGoals.map((goal) => {
        const percent = Math.min(100, Math.round((goal.depositedStars / goal.targetStars) * 100))
        const value = amountByGoal[goal.id] ?? ""
        const amount = Number(value)
        return (
          <div key={goal.id} className="rounded-2xl bg-card p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{goal.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-foreground">{goal.title}</p>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1 text-xs font-bold text-muted-foreground">
                  {goal.depositedStars}/{goal.targetStars} estrelas
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="number"
                min={1}
                max={stars}
                value={value}
                onChange={(event) => setAmountByGoal((prev) => ({ ...prev, [goal.id]: event.target.value }))}
                placeholder="Estrelas"
                className="min-w-0 flex-1 rounded-xl border-2 border-muted bg-background px-3 py-2 text-sm font-bold outline-none focus:border-emerald-400"
              />
              <button
                disabled={!amount || amount < 1 || amount > stars}
                onClick={() => onDeposit(goal.id, amount)}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-white shadow-md transition-colors hover:bg-emerald-600 disabled:opacity-40"
              >
                Depositar
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
