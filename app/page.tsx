"use client"

import { useState, useEffect } from "react"
import { StarPanel } from "@/components/star-panel"
import { TaskList } from "@/components/task-list"
import { RewardsShop } from "@/components/rewards-shop"
import { PenaltyList } from "@/components/penalty-list"
import { RoutineSchedule } from "@/components/routine-schedule"
import { Confetti } from "@/components/confetti"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { StreakDisplay } from "@/components/streak-display"
import { AvatarShop, type AvatarItem } from "@/components/avatar-shop"
import { MysteryBox } from "@/components/mystery-box"
import { useAuth } from "@/hooks/use-auth"
import { Star, Gift, AlertTriangle, Clock, Loader2, LogOut, Settings, Sparkles, Package } from "lucide-react"
import {
  starsApi,
  tasksApi,
  penaltiesApi,
  rewardsApi,
  routinesApi,
  streaksApi,
  avatarApi,
  mysteryBoxApi,
  type Task,
  type Penalty,
  type Reward,
  type RoutineItem,
  type MysteryPrize,
} from "@/lib/api"

// Dados locais de fallback (usados quando API nao esta disponivel)
const FALLBACK_TASKS = [
  { id: "dever", title: "Fazer o dever sem brigar", emoji: "📚", completed: false },
  { id: "brinquedos", title: "Guardar os brinquedos", emoji: "🧸", completed: false },
  { id: "respeito", title: "Falar com respeito", emoji: "💬", completed: false },
  { id: "escola", title: "Se arrumar para a escola sem enrolar", emoji: "🎒", completed: false },
  { id: "banho", title: "Tomar banho no horario", emoji: "🛁", completed: false },
  { id: "dentes", title: "Escovar os dentes", emoji: "🦷", completed: false },
]

const FALLBACK_PENALTIES = [
  { id: "brigar", title: "Brigou ou bateu", emoji: "😤", amount: 2 },
  { id: "desrespeito", title: "Falou com desrespeito", emoji: "🗣️", amount: 2 },
  { id: "birra", title: "Fez birra ou pirraca", emoji: "😢", amount: 1 },
  { id: "nao-obedeceu", title: "Nao obedeceu", emoji: "🙉", amount: 1 },
  { id: "mentiu", title: "Mentiu", emoji: "🤥", amount: 2 },
  { id: "gritou", title: "Gritou ou esperneou", emoji: "📢", amount: 1 },
]

const FALLBACK_REWARDS = [
  { id: "filme", title: "Escolher o filme", emoji: "🎬", description: "Escolha o filme da familia!", cost: 10 },
  { id: "tela", title: "15 min extra de tela", emoji: "📱", description: "Mais tempo no tablet ou TV!", cost: 10 },
  { id: "passeio", title: "Passeio simples", emoji: "🚗", description: "Um passeio especial!", cost: 10 },
  { id: "jantar", title: "Jantar de domingo", emoji: "🍕", description: "Voce escolhe o cardapio!", cost: 10 },
  { id: "brincadeira", title: "Brincadeira especial", emoji: "🎮", description: "Escolha a brincadeira!", cost: 10 },
  { id: "adesivo", title: "Adesivo/Cartao", emoji: "🎨", description: "Um adesivo ou cartao legal!", cost: 10 },
]

const FALLBACK_ROUTINES: RoutineItem[] = [
  { id: "acordar", time: "08:00", title: "Acordar", emoji: "🌅", period: "morning" },
  { id: "cama-higiene", time: "08:10", title: "Arrumar a cama + higiene", emoji: "🛏️", period: "morning" },
  { id: "cafe", time: "08:20", title: "Cafe da manha", emoji: "🥣", period: "morning" },
  { id: "plantas", time: "08:45", title: "Regar as plantas", emoji: "🌱", period: "morning" },
  { id: "brincar-manha", time: "09:00", title: "Brincar", emoji: "🎮", period: "morning" },
  { id: "organizacao", time: "10:00", title: "Organizacao rapida da casa", emoji: "🧹", period: "morning" },
  { id: "banho-manha", time: "10:30", title: "Banho", emoji: "🛁", period: "morning" },
  { id: "almoco", time: "11:00", title: "Almoco", emoji: "🍽️", period: "morning" },
  { id: "mochila", time: "11:30", title: "Arrumar mochila / vestir uniforme", emoji: "🎒", period: "morning" },
  { id: "van", time: "11:40", title: "Van para a escola", emoji: "🚐", period: "morning" },
  { id: "chega-escola", time: "18:15", title: "Chega da escola", emoji: "🏠", period: "evening" },
  { id: "lanche", time: "18:20", title: "Lanche", emoji: "🍎", period: "evening" },
  { id: "dever", time: "18:40", title: "Dever de casa (max 30 min)", emoji: "📚", period: "evening" },
  { id: "brincar-noite", time: "19:10", title: "Tempo de brincar / celular / TV", emoji: "📱", period: "evening" },
  { id: "banho-noite", time: "20:00", title: "Banho da noite", emoji: "🚿", period: "evening" },
  { id: "jantar", time: "20:20", title: "Jantar", emoji: "🍝", period: "evening" },
  { id: "momento-mamae", time: "20:45", title: "Momento especial com a mamae", emoji: "💕", period: "evening" },
  { id: "escovar-dentes", time: "21:00", title: "Escovar os dentes", emoji: "🦷", period: "evening" },
  { id: "dormir", time: "21:05", title: "Dormir", emoji: "😴", period: "evening" },
]

const FALLBACK_AVATAR_ITEMS: AvatarItem[] = [
  { id: "hat-crown", name: "Coroa", emoji: "👑", type: "hat", cost: 8, owned: false, equipped: false },
  { id: "hat-cap", name: "Bone", emoji: "🧢", type: "hat", cost: 5, owned: true, equipped: true },
  { id: "hat-wizard", name: "Mago", emoji: "🎩", type: "hat", cost: 12, owned: false, equipped: false },
  { id: "hat-party", name: "Festa", emoji: "🥳", type: "hat", cost: 6, owned: false, equipped: false },
  { id: "acc-glasses", name: "Oculos", emoji: "😎", type: "accessory", cost: 4, owned: true, equipped: false },
  { id: "acc-bow", name: "Gravata", emoji: "🎀", type: "accessory", cost: 5, owned: false, equipped: false },
  { id: "acc-medal", name: "Medalha", emoji: "🏅", type: "accessory", cost: 10, owned: false, equipped: false },
  { id: "bg-stars", name: "Estrelas", emoji: "✨", type: "background", cost: 6, owned: false, equipped: false },
  { id: "bg-rainbow", name: "Arco-iris", emoji: "🌈", type: "background", cost: 8, owned: false, equipped: false },
  { id: "bg-space", name: "Espaco", emoji: "🚀", type: "background", cost: 10, owned: false, equipped: false },
  { id: "out-ninja", name: "Ninja", emoji: "🥷", type: "outfit", cost: 15, owned: false, equipped: false },
  { id: "out-superhero", name: "Heroi", emoji: "🦸", type: "outfit", cost: 20, owned: false, equipped: false },
  { id: "out-robot", name: "Robo", emoji: "🤖", type: "outfit", cost: 18, owned: false, equipped: false },
]

const FALLBACK_MYSTERY_PRIZES: MysteryPrize[] = [
  { id: "p1", name: "Bala", emoji: "🍬", rarity: "common", description: "Uma bala gostosa!" },
  { id: "p2", name: "Adesivo", emoji: "🏷️", rarity: "common", description: "Um adesivo legal!" },
  { id: "p3", name: "Desenho extra", emoji: "📺", rarity: "common", description: "5 min a mais de desenho" },
  { id: "p4", name: "Escolher sobremesa", emoji: "🍨", rarity: "rare", description: "Voce escolhe a sobremesa!" },
  { id: "p5", name: "Joguinho", emoji: "🎮", rarity: "rare", description: "10 min extra de jogo" },
  { id: "p6", name: "Filme especial", emoji: "🎬", rarity: "epic", description: "Assistir filme fora de hora!" },
  { id: "p7", name: "Passeio surpresa", emoji: "🎢", rarity: "epic", description: "Um passeio surpresa!" },
  { id: "p8", name: "Super premio", emoji: "🏆", rarity: "legendary", description: "O premio dos seus sonhos!" },
]

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading, isAdmin, login, logout } = useAuth()
  const [authView, setAuthView] = useState<"login" | "register">("login")
  const [showAdminView, setShowAdminView] = useState(false)

  const [activeTab, setActiveTab] = useState<"tasks" | "rewards" | "penalties" | "routine" | "avatar" | "mystery">(
    "tasks",
  )
  const [stars, setStars] = useState(0)
  const [streak, setStreak] = useState(3) // Demo streak
  const [showConfetti, setShowConfetti] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [useLocalMode, setUseLocalMode] = useState(false)

  const [tasks, setTasks] = useState<Task[]>(FALLBACK_TASKS)
  const [penalties, setPenalties] = useState<Penalty[]>(FALLBACK_PENALTIES)
  const [rewards, setRewards] = useState<Reward[]>(FALLBACK_REWARDS)
  const [routines, setRoutines] = useState<RoutineItem[]>(FALLBACK_ROUTINES)
  const [avatarItems, setAvatarItems] = useState<AvatarItem[]>(FALLBACK_AVATAR_ITEMS)
  const [mysteryPrizes, setMysteryPrizes] = useState<MysteryPrize[]>(FALLBACK_MYSTERY_PRIZES)
  const [mysteryBoxCost, setMysteryBoxCost] = useState(5)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    async function loadData() {
      try {
        const [starsData, tasksData, penaltiesData, rewardsData, routinesData, streakData, avatarData, mysteryBoxConfig] =
          await Promise.all([
            starsApi.getBalance(),
            tasksApi.list(),
            penaltiesApi.list(),
            rewardsApi.list(),
            routinesApi.list(),
            streaksApi.get().catch(() => ({ currentStreak: 3 })),
            avatarApi.getItems().catch(() => FALLBACK_AVATAR_ITEMS),
            mysteryBoxApi.getConfig().catch(() => ({ cost: 5, prizes: FALLBACK_MYSTERY_PRIZES })),
          ])

        setStars(starsData.stars ?? 0)
        setTasks(tasksData.length > 0 ? tasksData : FALLBACK_TASKS)
        setPenalties(penaltiesData.length > 0 ? penaltiesData : FALLBACK_PENALTIES)
        setRewards(rewardsData.length > 0 ? rewardsData : FALLBACK_REWARDS)
        setRoutines(routinesData.length > 0 ? routinesData : FALLBACK_ROUTINES)
        setStreak(streakData.currentStreak ?? 3)
        setAvatarItems(avatarData.length > 0 ? avatarData : FALLBACK_AVATAR_ITEMS)
        setMysteryPrizes(mysteryBoxConfig.prizes.length > 0 ? mysteryBoxConfig.prizes : FALLBACK_MYSTERY_PRIZES)
        setMysteryBoxCost(mysteryBoxConfig.cost || 5)
        setUseLocalMode(false)
      } catch (error) {
        console.warn("API nao disponivel, usando modo local:", error)
        setUseLocalMode(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated])

  // ============ TASK HANDLERS ============
  const handleTaskComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.completed) return

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)))
    setStars((prev) => prev + 1)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)

    // Check if all tasks completed to update streak
    const allCompleted = tasks.filter((t) => t.id !== taskId).every((t) => t.completed)
    if (allCompleted) {
      setStreak((prev) => prev + 1)
    }

    if (!useLocalMode) {
      try {
        await tasksApi.complete(taskId)
      } catch (error) {
        console.error("Erro ao completar tarefa:", error)
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: false } : t)))
        setStars((prev) => prev - 1)
      }
    }
  }

  const handleTaskCreate = async (taskData: Omit<Task, "id" | "completed">) => {
    const newTask: Task = { ...taskData, id: `task-${Date.now()}`, completed: false }
    setTasks((prev) => [...prev, newTask])

    if (!useLocalMode) {
      try {
        const created = await tasksApi.create(taskData)
        setTasks((prev) => prev.map((t) => (t.id === newTask.id ? created : t)))
      } catch (error) {
        console.error("Erro ao criar tarefa:", error)
      }
    }
  }

  const handleTaskUpdate = async (id: string, taskData: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...taskData } : t)))

    if (!useLocalMode) {
      try {
        await tasksApi.update(id, taskData)
      } catch (error) {
        console.error("Erro ao atualizar tarefa:", error)
      }
    }
  }

  const handleTaskDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))

    if (!useLocalMode) {
      try {
        await tasksApi.delete(id)
      } catch (error) {
        console.error("Erro ao deletar tarefa:", error)
      }
    }
  }

  // ============ PENALTY HANDLERS ============
  const handlePenalty = async (penaltyId: string, amount: number) => {
    setStars((prev) => Math.max(0, prev - amount))

    if (!useLocalMode) {
      try {
        await penaltiesApi.apply(penaltyId)
      } catch (error) {
        console.error("Erro ao aplicar penalidade:", error)
        setStars((prev) => prev + amount)
      }
    }
  }

  const handlePenaltyCreate = async (penaltyData: Omit<Penalty, "id">) => {
    const newPenalty: Penalty = { ...penaltyData, id: `penalty-${Date.now()}` }
    setPenalties((prev) => [...prev, newPenalty])

    if (!useLocalMode) {
      try {
        const created = await penaltiesApi.create(penaltyData)
        setPenalties((prev) => prev.map((p) => (p.id === newPenalty.id ? created : p)))
      } catch (error) {
        console.error("Erro ao criar penalidade:", error)
      }
    }
  }

  const handlePenaltyUpdate = async (id: string, penaltyData: Partial<Penalty>) => {
    setPenalties((prev) => prev.map((p) => (p.id === id ? { ...p, ...penaltyData } : p)))

    if (!useLocalMode) {
      try {
        await penaltiesApi.update(id, penaltyData)
      } catch (error) {
        console.error("Erro ao atualizar penalidade:", error)
      }
    }
  }

  const handlePenaltyDelete = async (id: string) => {
    setPenalties((prev) => prev.filter((p) => p.id !== id))

    if (!useLocalMode) {
      try {
        await penaltiesApi.delete(id)
      } catch (error) {
        console.error("Erro ao deletar penalidade:", error)
      }
    }
  }

  // ============ REWARD HANDLERS ============
  const handleRewardRedeem = async (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId)
    if (!reward || stars < reward.cost) return

    setStars((prev) => prev - reward.cost)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)

    if (!useLocalMode) {
      try {
        await rewardsApi.redeem(rewardId)
      } catch (error) {
        console.error("Erro ao resgatar recompensa:", error)
        setStars((prev) => prev + reward.cost)
      }
    }
  }

  const handleRewardCreate = async (rewardData: Omit<Reward, "id">) => {
    const newReward: Reward = { ...rewardData, id: `reward-${Date.now()}` }
    setRewards((prev) => [...prev, newReward])

    if (!useLocalMode) {
      try {
        const created = await rewardsApi.create(rewardData)
        setRewards((prev) => prev.map((r) => (r.id === newReward.id ? created : r)))
      } catch (error) {
        console.error("Erro ao criar recompensa:", error)
      }
    }
  }

  const handleRewardUpdate = async (id: string, rewardData: Partial<Reward>) => {
    setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, ...rewardData } : r)))

    if (!useLocalMode) {
      try {
        await rewardsApi.update(id, rewardData)
      } catch (error) {
        console.error("Erro ao atualizar recompensa:", error)
      }
    }
  }

  const handleRewardDelete = async (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id))

    if (!useLocalMode) {
      try {
        await rewardsApi.delete(id)
      } catch (error) {
        console.error("Erro ao deletar recompensa:", error)
      }
    }
  }

  // ============ ROUTINE HANDLERS ============
  const handleRoutineCreate = async (routineData: Omit<RoutineItem, "id">) => {
    const newRoutine: RoutineItem = { ...routineData, id: `routine-${Date.now()}` }
    setRoutines((prev) => [...prev, newRoutine].sort((a, b) => a.time.localeCompare(b.time)))

    if (!useLocalMode) {
      try {
        const created = await routinesApi.create(routineData)
        setRoutines((prev) =>
          prev.map((r) => (r.id === newRoutine.id ? created : r)).sort((a, b) => a.time.localeCompare(b.time)),
        )
      } catch (error) {
        console.error("Erro ao criar rotina:", error)
      }
    }
  }

  const handleRoutineUpdate = async (id: string, routineData: Partial<RoutineItem>) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...routineData } : r)).sort((a, b) => a.time.localeCompare(b.time)),
    )

    if (!useLocalMode) {
      try {
        await routinesApi.update(id, routineData)
      } catch (error) {
        console.error("Erro ao atualizar rotina:", error)
      }
    }
  }

  const handleRoutineDelete = async (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id))

    if (!useLocalMode) {
      try {
        await routinesApi.delete(id)
      } catch (error) {
        console.error("Erro ao deletar rotina:", error)
      }
    }
  }

  const handleResetDay = async () => {
    setTasks((prev) => prev.map((t) => ({ ...t, completed: false })))

    if (!useLocalMode) {
      try {
        await tasksApi.resetDay()
      } catch (error) {
        console.error("Erro ao resetar tarefas:", error)
      }
    }
  }

  // ============ AVATAR HANDLERS ============
  const handleAvatarPurchase = async (itemId: string, cost: number) => {
    if (stars < cost) return

    setStars((prev) => prev - cost)
    setAvatarItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, owned: true } : item)))
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)

    if (!useLocalMode) {
      try {
        await avatarApi.purchase(itemId)
      } catch (error) {
        console.error("Erro ao comprar item:", error)
        setStars((prev) => prev + cost)
        setAvatarItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, owned: false } : item)))
      }
    }
  }

  const handleAvatarEquip = async (itemId: string) => {
    const item = avatarItems.find((i) => i.id === itemId)
    if (!item || !item.owned) return

    setAvatarItems((prev) =>
      prev.map((i) => {
        if (i.type === item.type) {
          return { ...i, equipped: i.id === itemId }
        }
        return i
      }),
    )

    if (!useLocalMode) {
      try {
        await avatarApi.equip(itemId)
      } catch (error) {
        console.error("Erro ao equipar item:", error)
      }
    }
  }

  // ============ MYSTERY BOX HANDLER ============
  const handleMysteryBoxOpen = async (cost: number): Promise<MysteryPrize> => {
    if (useLocalMode) {
      // Modo local - lógica antiga
      setStars((prev) => prev - cost)
      const weights = { common: 50, rare: 30, epic: 15, legendary: 5 }
      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
      let random = Math.random() * totalWeight
      let selectedRarity: MysteryPrize["rarity"] = "common"
      for (const [rarity, weight] of Object.entries(weights)) {
        random -= weight
        if (random <= 0) {
          selectedRarity = rarity as MysteryPrize["rarity"]
          break
        }
      }
      const prizesOfRarity = mysteryPrizes.filter((p) => p.rarity === selectedRarity)
      const prize = prizesOfRarity[Math.floor(Math.random() * prizesOfRarity.length)]
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
      return prize
    }

    // Modo API - usar endpoint do backend
    try {
      const result = await mysteryBoxApi.open()
      setStars(result.newBalance)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
      return result.prize
    } catch (error) {
      console.error("Erro ao abrir caixa:", error)
      throw error
    }
  }

  // ============ MYSTERY PRIZE HANDLERS ============
  // Verifica se o ID é um UUID válido (formato do backend) ou um ID de fallback
  const isFallbackId = (id: string) => {
    // IDs de fallback são simples como "p1", "p2", etc.
    // UUIDs têm formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    return !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  }

  const handleMysteryPrizeCreate = async (prizeData: Omit<MysteryPrize, "id">) => {
    const newPrize: MysteryPrize = { ...prizeData, id: `prize-${Date.now()}` }
    setMysteryPrizes((prev) => [...prev, newPrize])

    if (!useLocalMode) {
      try {
        const created = await mysteryBoxApi.createPrize(prizeData)
        setMysteryPrizes((prev) => prev.map((p) => (p.id === newPrize.id ? created : p)))
      } catch (error) {
        console.error("Erro ao criar prêmio:", error)
        setMysteryPrizes((prev) => prev.filter((p) => p.id !== newPrize.id))
      }
    }
  }

  const handleMysteryPrizeUpdate = async (id: string, prizeData: Partial<MysteryPrize>) => {
    // Se for um ID de fallback, criar um novo prêmio ao invés de atualizar
    if (isFallbackId(id)) {
      // Remover o prêmio antigo e criar um novo
      setMysteryPrizes((prev) => prev.filter((p) => p.id !== id))
      await handleMysteryPrizeCreate({
        name: prizeData.name || "",
        emoji: prizeData.emoji || "",
        rarity: prizeData.rarity || "common",
        description: prizeData.description || "",
        weight: prizeData.weight || 50,
      })
      return
    }

    setMysteryPrizes((prev) => prev.map((p) => (p.id === id ? { ...p, ...prizeData } : p)))

    if (!useLocalMode) {
      try {
        await mysteryBoxApi.updatePrize(id, prizeData)
      } catch (error) {
        console.error("Erro ao atualizar prêmio:", error)
        // Reverter a mudança local em caso de erro
        setMysteryPrizes((prev) => {
          const original = prev.find((p) => p.id === id)
          if (original) {
            return prev.map((p) => (p.id === id ? original : p))
          }
          return prev
        })
      }
    }
  }

  const handleMysteryPrizeDelete = async (id: string) => {
    // Se for um ID de fallback, apenas remover localmente
    if (isFallbackId(id)) {
      setMysteryPrizes((prev) => prev.filter((p) => p.id !== id))
      return
    }

    setMysteryPrizes((prev) => prev.filter((p) => p.id !== id))

    if (!useLocalMode) {
      try {
        await mysteryBoxApi.deletePrize(id)
      } catch (error) {
        console.error("Erro ao deletar prêmio:", error)
        // Em caso de erro, recarregar os prêmios do backend
        try {
          const config = await mysteryBoxApi.getConfig()
          setMysteryPrizes(config.prizes)
        } catch (reloadError) {
          console.error("Erro ao recarregar prêmios:", reloadError)
        }
      }
    }
  }

  // ============ RENDER ============
  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold text-muted-foreground">Verificando...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    if (authView === "register") {
      return <RegisterForm onSuccess={login} onSwitchToLogin={() => setAuthView("login")} />
    }
    return <LoginForm onSuccess={login} onSwitchToRegister={() => setAuthView("register")} />
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

  if (isAdmin && showAdminView) {
    return (
      <AdminDashboard
        tasks={tasks}
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
        onBack={() => setShowAdminView(false)}
      />
    )
  }

  const completedTasks = tasks.filter((t) => t.completed).map((t) => t.id)

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50">
      {showConfetti && <Confetti />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-emerald-500 px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black text-primary-foreground drop-shadow-md">
            Quadro de Recompensas do Gabriel
          </h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowAdminView(true)}
                className="flex items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/30"
              >
                <Settings className="h-4 w-4" />
                Admin
              </button>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/30"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
        {useLocalMode && (
          <p className="mt-1 text-center text-xs text-primary-foreground/70">Modo offline - dados locais</p>
        )}
      </header>

      {/* Star Panel and Streak */}
      <div className="space-y-4 px-4 py-6">
        <StarPanel stars={stars} />
        <StreakDisplay streak={streak} />
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
          onClick={() => setActiveTab("avatar")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "avatar"
              ? "bg-purple-500 text-white shadow-md"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-[10px]">Avatar</span>
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
          <TaskList
            tasks={tasks}
            completedTasks={completedTasks}
            onTaskComplete={handleTaskComplete}
            onResetDay={handleResetDay}
          />
        ) : activeTab === "routine" ? (
          <RoutineSchedule routines={routines} />
        ) : activeTab === "penalties" ? (
          <PenaltyList penalties={penalties} onPenalty={handlePenalty} />
        ) : activeTab === "rewards" ? (
          <RewardsShop stars={stars} rewards={rewards} onRedeem={handleRewardRedeem} />
        ) : activeTab === "avatar" ? (
          <AvatarShop stars={stars} items={avatarItems} onPurchase={handleAvatarPurchase} onEquip={handleAvatarEquip} />
        ) : (
          <MysteryBox stars={stars} cost={mysteryBoxCost} prizes={mysteryPrizes} onOpen={handleMysteryBoxOpen} />
        )}
      </div>

      {/* Bottom padding for mobile */}
      <div className="h-8" />
    </main>
  )
}
