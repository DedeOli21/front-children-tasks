"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { StarPanel } from "@/components/star-panel"
import { TaskList } from "@/components/task-list"
import { RewardsShop } from "@/components/rewards-shop"
import { PenaltyList } from "@/components/penalty-list"
import { RoutineSchedule } from "@/components/routine-schedule"
import { Confetti } from "@/components/confetti"
import { StreakDisplay } from "@/components/streak-display"
import { MysteryBox } from "@/components/mystery-box"
import {
  Star,
  Gift,
  AlertTriangle,
  Clock,
  Loader2,
  LogOut,
  Package,
  Rocket,
  Check,
  Play,
  Timer,
  XCircle,
  Sprout,
  Sparkles,
  BookOpen,
  House,
  Mic,
  Send,
} from "lucide-react"
import { PetScreen } from "@/components/pet/pet-screen"
import { DropModal, inferDropItemType } from "@/components/pet/drop-modal"
import { NotificationBell } from "@/components/shared/notification-bell"
import {
  starsApi,
  tasksApi,
  activeTasksApi,
  penaltiesApi,
  rewardsApi,
  routinesApi,
  streaksApi,
  mysteryBoxApi,
  missionsApi,
  focusApi,
  goalsApi,
  proactiveRequestsApi,
  petApi,
  type Task,
  type ActiveTask,
  type Penalty,
  type Reward,
  type RoutineItem,
  type MysteryPrize,
  type Mission,
  type StarRequest,
  type StreakData,
  type FocusSession,
  type FamilyGoal,
  type ProactiveCategoryIcon,
  type ProactiveRequest,
  type PetRewardResult,
} from "@/lib/api"

type ChildTab =
  | "tasks"
  | "pet"
  | "routine"
  | "penalties"
  | "rewards"
  | "mystery"

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
  const [pendingInitiatives, setPendingInitiatives] = useState<
    ProactiveRequest[]
  >([])
  const [showInitiativeModal, setShowInitiativeModal] = useState(false)
  const [dropReward, setDropReward] = useState<PetRewardResult | null>(null)
  const [isEquippingDrop, setIsEquippingDrop] = useState(false)
  const [petRefreshKey, setPetRefreshKey] = useState(0)
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
      const [
        starsData,
        tasksData,
        activeTasksData,
        missionsData,
        penaltiesData,
        rewardsData,
        routinesData,
        goalsData,
        streakData,
        mysteryBoxConfig,
        bonusesData,
        initiativesData,
      ] = await Promise.all([
        starsApi.getBalance(),
        tasksApi.list(),
        activeTasksApi.forDay().catch(() => [] as ActiveTask[]),
        missionsApi.forDay().catch(() => [] as Mission[]),
        penaltiesApi.list(),
        rewardsApi.list(),
        routinesApi.list(),
        goalsApi.list().catch(() => [] as FamilyGoal[]),
        streaksApi.get().catch(() => null as StreakData | null),
        mysteryBoxApi
          .getConfig()
          .catch(() => ({ cost: 5, prizes: [] as MysteryPrize[] })),
        starsApi.listRequests().catch(() => [] as StarRequest[]),
        proactiveRequestsApi
          .list("pending")
          .catch(() => [] as ProactiveRequest[]),
      ])

      setStars(starsData.stars ?? 0)
      setTasks([
        ...tasksData.map((task) => ({ ...task, source: "classic" as const })),
        ...activeTasksData.map((task) => ({
          id: task.id,
          title: task.title,
          emoji: task.emoji,
          completed: task.status !== "pending",
          status: task.status,
          completedAt: task.completedAt ?? undefined,
          source: "active" as const,
        })),
      ])
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
      setPendingInitiatives(initiativesData)
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
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        loadData()
      }
    }

    document.addEventListener("visibilitychange", refreshWhenVisible)
    window.addEventListener("focus", loadData)

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible)
      window.removeEventListener("focus", loadData)
    }
  }, [loadData])

  useEffect(() => {
    if (
      !focusSession ||
      focusSession.status !== "running" ||
      focusRemainingSeconds <= 0
    )
      return

    const timer = window.setInterval(() => {
      setFocusRemainingSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [focusRemainingSeconds, focusSession])

  const celebrate = (duration = 2000) => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), duration)
  }

  const showDropReward = useCallback((petReward?: PetRewardResult | null) => {
    if (!petReward?.drop.dropped || !petReward.drop.item) return
    if (petReward.drop.bonus?.type === "streak_freeze") {
      setFreezes(petReward.drop.bonus.newBalance)
    }
    setDropReward(petReward)
  }, [])

  const handleTaskComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.completed) return

    // Atualização otimista com rollback em caso de erro.
    // As estrelas só chegam quando o responsável aprovar.
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: true, status: "completed" } : t,
      ),
    )
    celebrate()

    try {
      const result =
        task.source === "active"
          ? await activeTasksApi.complete(taskId)
          : await tasksApi.complete(taskId)
      if ("streak" in result && result.streak !== undefined)
        setStreak(result.streak)
      showDropReward(result.petReward)
      toast.info("Tarefa enviada! Aguardando o chefe aprovar 🕐")
    } catch (error) {
      console.error("Erro ao completar tarefa:", error)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: false, status: "pending" } : t,
        ),
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
      const result = await missionsApi.complete(missionId)
      showDropReward(result.petReward)
      toast.info("Missão enviada! Aguardando o chefe aprovar 🕐")
    } catch (error) {
      console.error("Erro ao concluir missão:", error)
      setMissions((prev) =>
        prev.map((m) =>
          m.id === missionId ? { ...m, status: "scheduled" } : m,
        ),
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
      if (reward.kind === "streak_freeze")
        toast.success("Regador Mágico guardado para proteger sua plantinha!")
    } catch (error) {
      console.error("Erro ao resgatar recompensa:", error)
      setStars((prev) => prev + reward.cost)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível resgatar a recompensa.",
      )
    }
  }

  const handleMysteryBoxOpen = async (): Promise<MysteryPrize> => {
    try {
      const result = await mysteryBoxApi.open()
      setStars(result.newBalance)
      celebrate(3000)
      return result.prize
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir a caixa surpresa.",
      )
      throw error
    }
  }

  const handleGoalDeposit = async (goalId: string, amount: number) => {
    try {
      const result = await goalsApi.deposit(goalId, { amount })
      setStars(result.currentStars)
      setGoals((prev) =>
        prev.map((goal) => (goal.id === result.goal.id ? result.goal : goal)),
      )
      toast.success(result.message)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível depositar no cofrinho.",
      )
    }
  }

  const handleStartFocus = async (mission: Mission) => {
    if (mission.status !== "scheduled") return
    try {
      const session = await focusApi.start({
        missionId: mission.id,
        durationMinutes: 15,
      })
      setFocusSession(session)
      setFocusMissionTitle(mission.title)
      setFocusRemainingSeconds(session.durationMinutes * 60)
      toast.success("Modo Foco iniciado!")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o foco.",
      )
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
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o foco.",
      )
    }
  }

  const handleCreateProactiveRequest = async (data: {
    categoryIcon: ProactiveCategoryIcon
    description: string
    suggestedStars: number
  }) => {
    const created = await proactiveRequestsApi.create(data)
    setPendingInitiatives((prev) => [created, ...prev])
    toast.success(created.message)
  }

  const handleDropClose = () => {
    setDropReward(null)
    setIsEquippingDrop(false)
  }

  const handleEquipDrop = async () => {
    const itemId = dropReward?.drop.item?.id
    if (!itemId) return

    setIsEquippingDrop(true)
    try {
      const result = await petApi.equip(itemId)
      toast.success(result.message)
      setDropReward(null)
      setPetRefreshKey((current) => current + 1)
      setActiveTab("pet")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível equipar esse item.",
      )
    } finally {
      setIsEquippingDrop(false)
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
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível encerrar o foco.",
      )
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold text-muted-foreground">
            Carregando...
          </p>
        </div>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 px-4">
        <p className="text-center text-lg font-bold text-foreground">
          Não foi possível carregar seus dados 😢
        </p>
        <button
          onClick={loadData}
          className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105"
        >
          Tentar novamente
        </button>
        <button
          onClick={onLogout}
          className="text-sm font-semibold text-muted-foreground underline"
        >
          Sair
        </button>
      </main>
    )
  }

  const completedTasks = tasks.filter((t) => t.completed).map((t) => t.id)
  const focusMinutes = Math.floor(focusRemainingSeconds / 60)
  const focusSeconds = focusRemainingSeconds % 60
  const droppedItem = dropReward?.drop.item
  const dropBonus = dropReward?.drop.bonus
  const canEquipDroppedItem = Boolean(
    droppedItem?.id && droppedItem?.attachmentSlot,
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50">
      {showConfetti && <Confetti />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-emerald-500 px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/assets/pet_avatar_icon.jpg"
              alt=""
              width={44}
              height={44}
              priority
              className="h-11 w-11 shrink-0 rounded-full border-2 border-white/70 object-cover shadow-md"
            />
            <h1 className="min-w-0 text-lg font-black text-primary-foreground drop-shadow-md">
              Quadro de Recompensas de {childName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={onLogout}
              className="flex items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/30"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Star Panel and Streak */}
      <div className="space-y-4 px-4 py-6">
        <StarPanel stars={stars} />
        <StreakDisplay
          streak={streak}
          longestStreak={longestStreak}
          freezes={freezes}
          plant={plant ?? undefined}
        />

        {focusSession?.status === "running" && (
          <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <Timer className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-white/70">
                    Modo Foco
                  </p>
                  <p className="font-black">
                    {focusMissionTitle || "Missão acadêmica"}
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-white/20 px-3 py-2 font-mono text-2xl font-black">
                {String(focusMinutes).padStart(2, "0")}:
                {String(focusSeconds).padStart(2, "0")}
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
              💜 Você recebeu{" "}
              {pendingBonuses.reduce((sum, b) => sum + b.amount, 0)} estrela(s)
              da sua terapeuta!
            </p>
            <p className="mt-1 text-sm font-semibold text-purple-500">
              Aguardando o chefe aprovar! 🕐
            </p>
          </div>
        )}

        {pendingInitiatives.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-100 to-lime-100 p-4 shadow-lg ring-2 ring-emerald-200">
            <p className="font-black text-emerald-700">
              ✨ {pendingInitiatives.length} Super Iniciativa
              {pendingInitiatives.length > 1 ? "s" : ""} aguardando aprovação
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-600/80">
              O chefe vai revisar e liberar as estrelas.
            </p>
          </div>
        )}
      </div>

      <nav className="sticky top-16 z-30 mx-4 grid grid-cols-6 gap-1 rounded-2xl bg-card p-2 shadow-lg">
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
          onClick={() => setActiveTab("pet")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "pet"
              ? "bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-md"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Sprout className="h-4 w-4" />
          <span className="text-[10px]">Planta</span>
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
                  <h2 className="text-lg font-black text-foreground">
                    Missões da Escola
                  </h2>
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
                        if (
                          !isDone &&
                          (event.key === "Enter" || event.key === " ")
                        )
                          handleMissionComplete(mission.id)
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
                            <Check
                              className="h-8 w-8 text-white"
                              strokeWidth={3}
                            />
                          ) : (
                            <span className="text-3xl">
                              {mission.iconEmoji}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-lg font-bold ${isApproved ? "text-primary" : "text-foreground"}`}
                          >
                            {mission.title}
                          </p>
                          {mission.description && !isDone && (
                            <p className="text-sm text-muted-foreground">
                              {mission.description}
                            </p>
                          )}
                          <p
                            className={`text-sm ${
                              isDone && !isApproved
                                ? "font-semibold text-amber-600"
                                : "text-muted-foreground"
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
                            <span className="text-xl">
                              {isApproved ? "⭐" : "🕐"}
                            </span>
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
        ) : activeTab === "pet" ? (
          <PetScreen
            stars={stars}
            onStarsChange={setStars}
            refreshKey={petRefreshKey}
          />
        ) : activeTab === "routine" ? (
          <RoutineSchedule routines={routines} />
        ) : activeTab === "penalties" ? (
          <PenaltyList penalties={penalties} readOnly />
        ) : activeTab === "rewards" ? (
          <div className="space-y-5">
            <RewardsShop
              stars={stars}
              rewards={rewards}
              onRedeem={handleRewardRedeem}
            />
            <ChildGoalsPanel
              goals={goals}
              stars={stars}
              onDeposit={handleGoalDeposit}
            />
          </div>
        ) : (
          <MysteryBox
            stars={stars}
            cost={mysteryBoxCost}
            prizes={mysteryPrizes}
            onOpen={handleMysteryBoxOpen}
          />
        )}
      </div>

      {/* Bottom padding for mobile */}
      <div className="h-8" />

      <button
        onClick={() => setShowInitiativeModal(true)}
        className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 font-black text-white shadow-2xl shadow-emerald-700/30 transition-transform hover:scale-105 active:scale-95"
      >
        <Sparkles className="h-5 w-5" />
        Super Iniciativa
      </button>

      <DropModal
        open={Boolean(droppedItem)}
        itemType={inferDropItemType(droppedItem)}
        itemName={droppedItem?.name}
        itemImageSrc={droppedItem?.assetUrl}
        previewEmoji={droppedItem?.previewEmoji}
        rarity={droppedItem?.rarity}
        bonusLabel={
          dropBonus?.type === "streak_freeze"
            ? `+${dropBonus.amount} proteção de sequência`
            : undefined
        }
        canEquip={canEquipDroppedItem}
        isEquipping={isEquippingDrop}
        onEquip={handleEquipDrop}
        onClose={handleDropClose}
      />

      {showInitiativeModal && (
        <SuperInitiativeModal
          onClose={() => setShowInitiativeModal(false)}
          onSubmit={handleCreateProactiveRequest}
        />
      )}
    </main>
  )
}

type SpeechRecognitionEventLike = Event & {
  results: {
    length: number
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionController extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionController

function SuperInitiativeModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: {
    categoryIcon: ProactiveCategoryIcon
    description: string
    suggestedStars: number
  }) => Promise<void>
}) {
  const [categoryIcon, setCategoryIcon] =
    useState<ProactiveCategoryIcon>("studies")
  const [description, setDescription] = useState("")
  const [suggestedStars, setSuggestedStars] = useState("3")
  const [isSaving, setIsSaving] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionController | null>(null)

  const speechWindow =
    typeof window === "undefined"
      ? null
      : (window as Window & {
          SpeechRecognition?: SpeechRecognitionConstructor
          webkitSpeechRecognition?: SpeechRecognitionConstructor
        })
  const Recognition =
    speechWindow?.SpeechRecognition ?? speechWindow?.webkitSpeechRecognition

  const handleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    if (!Recognition) {
      toast.error("Seu navegador ainda não liberou gravação por voz.")
      return
    }

    const recognition = new Recognition()
    recognitionRef.current = recognition
    recognition.lang = "pt-BR"
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length })
        .map((_, index) => event.results[index]?.[0]?.transcript ?? "")
        .join(" ")
        .trim()
      if (transcript) {
        setDescription((current) =>
          [current.trim(), transcript].filter(Boolean).join(" "),
        )
      }
    }
    recognition.onerror = () => {
      setIsListening(false)
      toast.error("Não consegui ouvir agora. Tente de novo.")
    }
    recognition.onend = () => setIsListening(false)
    setIsListening(true)
    recognition.start()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const stars = Number.parseInt(suggestedStars, 10)
    if (description.trim().length < 5) {
      toast.error("Conte um pouco mais sobre o que você fez.")
      return
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 25) {
      toast.error("Sugira entre 1 e 25 estrelas.")
      return
    }

    setIsSaving(true)
    try {
      await onSubmit({
        categoryIcon,
        description: description.trim(),
        suggestedStars: stars,
      })
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a iniciativa.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-emerald-500">
              Super Iniciativa
            </p>
            <h2 className="text-xl font-black text-slate-800">
              O que você fez?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCategoryIcon("studies")}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 font-black transition-all ${
                categoryIcon === "studies"
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-slate-100 bg-slate-50 text-slate-500"
              }`}
            >
              <BookOpen className="h-5 w-5" />
              Estudos
            </button>
            <button
              type="button"
              onClick={() => setCategoryIcon("organization")}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 font-black transition-all ${
                categoryIcon === "organization"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-100 bg-slate-50 text-slate-500"
              }`}
            >
              <House className="h-5 w-5" />
              Organização
            </button>
          </div>

          <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-3 focus-within:border-emerald-300">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex: arrumei meu quarto sem ninguém pedir"
              rows={4}
              maxLength={500}
              className="min-h-28 w-full resize-none bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleVoice}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-colors ${
                  isListening
                    ? "bg-red-100 text-red-600"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Mic className="h-4 w-4" />
                {isListening ? "Ouvindo" : "Gravar"}
              </button>
              <span className="text-xs font-bold text-slate-400">
                {description.length}/500
              </span>
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span className="flex-1 text-sm font-black text-amber-700">
              Estrelas sugeridas
            </span>
            <input
              type="number"
              min={1}
              max={25}
              value={suggestedStars}
              onChange={(event) => setSuggestedStars(event.target.value)}
              className="w-20 rounded-xl border border-amber-200 bg-white px-3 py-2 text-center font-black text-amber-700 outline-none focus:border-amber-400"
            />
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-black text-white shadow-lg transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            Enviar para aprovação
          </button>
        </form>
      </div>
    </div>
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
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
          🐷
        </div>
        <div>
          <p className="text-lg font-black text-emerald-700">
            Cofrinho da Família
          </p>
          <p className="text-sm font-semibold text-emerald-600/80">
            Ajude todo mundo a alcançar uma meta!
          </p>
        </div>
      </div>

      {activeGoals.map((goal) => {
        const percent = Math.min(
          100,
          Math.round((goal.depositedStars / goal.targetStars) * 100),
        )
        const value = amountByGoal[goal.id] ?? ""
        const amount = Number(value)
        return (
          <div key={goal.id} className="rounded-2xl bg-card p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{goal.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-foreground">
                  {goal.title}
                </p>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${percent}%` }}
                  />
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
                onChange={(event) =>
                  setAmountByGoal((prev) => ({
                    ...prev,
                    [goal.id]: event.target.value,
                  }))
                }
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
