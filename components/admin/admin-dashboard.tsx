"use client"

import { useState } from "react"
import { Star, Gift, AlertTriangle, Clock, Plus, Pencil, Trash2, X, Check, ArrowLeft, BarChart3, Package } from "lucide-react"
import type { Task, Penalty, Reward, RoutineItem, MysteryPrize } from "@/lib/api"
import { HistoryReport } from "./history-report"
import { MysteryPrizesAdmin } from "./mystery-prizes-admin"

interface AdminDashboardProps {
  tasks: Task[]
  penalties: Penalty[]
  rewards: Reward[]
  routines: RoutineItem[]
  mysteryPrizes: MysteryPrize[]
  onTaskCreate: (task: Omit<Task, "id" | "completed">) => void
  onTaskUpdate: (id: string, task: Partial<Task>) => void
  onTaskDelete: (id: string) => void
  onPenaltyCreate: (penalty: Omit<Penalty, "id">) => void
  onPenaltyUpdate: (id: string, penalty: Partial<Penalty>) => void
  onPenaltyDelete: (id: string) => void
  onRewardCreate: (reward: Omit<Reward, "id">) => void
  onRewardUpdate: (id: string, reward: Partial<Reward>) => void
  onRewardDelete: (id: string) => void
  onRoutineCreate: (routine: Omit<RoutineItem, "id">) => void
  onRoutineUpdate: (id: string, routine: Partial<RoutineItem>) => void
  onRoutineDelete: (id: string) => void
  onMysteryPrizeCreate: (prize: Omit<MysteryPrize, "id">) => void
  onMysteryPrizeUpdate: (id: string, prize: Partial<MysteryPrize>) => void
  onMysteryPrizeDelete: (id: string) => void
  onBack: () => void
}

type AdminTab = "tasks" | "penalties" | "rewards" | "routines" | "history" | "mystery"

export function AdminDashboard({
  tasks,
  penalties,
  rewards,
  routines,
  mysteryPrizes,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onPenaltyCreate,
  onPenaltyUpdate,
  onPenaltyDelete,
  onRewardCreate,
  onRewardUpdate,
  onRewardDelete,
  onRoutineCreate,
  onRoutineUpdate,
  onRoutineDelete,
  onMysteryPrizeCreate,
  onMysteryPrizeUpdate,
  onMysteryPrizeDelete,
  onBack,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("tasks")

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center rounded-xl bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-white drop-shadow-md">Painel de Administracao</h1>
            <p className="text-xs text-white/70">Gerencie tarefas, recompensas e penalidades</p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-16 z-30 mx-4 mt-4 grid grid-cols-6 gap-1 rounded-2xl bg-white p-2 shadow-lg">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "tasks"
              ? "bg-emerald-500 text-white shadow-md"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Star className="h-4 w-4" />
          <span className="text-xs">Tarefas</span>
        </button>
        <button
          onClick={() => setActiveTab("routines")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "routines"
              ? "bg-indigo-500 text-white shadow-md"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span className="text-xs">Rotinas</span>
        </button>
        <button
          onClick={() => setActiveTab("penalties")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "penalties"
              ? "bg-red-500 text-white shadow-md"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">Penalidades</span>
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "rewards"
              ? "bg-amber-500 text-white shadow-md"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Gift className="h-4 w-4" />
          <span className="text-xs">Loja</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "history"
              ? "bg-purple-500 text-white shadow-md"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span className="text-xs">Histórico</span>
        </button>
        <button
          onClick={() => setActiveTab("mystery")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 font-bold transition-all duration-300 ${
            activeTab === "mystery"
              ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Gift className="h-4 w-4" />
          <span className="text-xs">Caixa</span>
        </button>
      </nav>

      {/* Content */}
      <div className="px-4 py-6">
        {activeTab === "tasks" && (
          <TasksAdmin tasks={tasks} onCreate={onTaskCreate} onUpdate={onTaskUpdate} onDelete={onTaskDelete} />
        )}
        {activeTab === "routines" && (
          <RoutinesAdmin
            routines={routines}
            onCreate={onRoutineCreate}
            onUpdate={onRoutineUpdate}
            onDelete={onRoutineDelete}
          />
        )}
        {activeTab === "penalties" && (
          <PenaltiesAdmin
            penalties={penalties}
            onCreate={onPenaltyCreate}
            onUpdate={onPenaltyUpdate}
            onDelete={onPenaltyDelete}
          />
        )}
        {activeTab === "rewards" && (
          <RewardsAdmin
            rewards={rewards}
            onCreate={onRewardCreate}
            onUpdate={onRewardUpdate}
            onDelete={onRewardDelete}
          />
        )}
        {activeTab === "history" && <HistoryReport />}
        {activeTab === "mystery" && (
          <MysteryPrizesAdmin
            prizes={mysteryPrizes}
            onCreate={onMysteryPrizeCreate}
            onUpdate={onMysteryPrizeUpdate}
            onDelete={onMysteryPrizeDelete}
          />
        )}
      </div>

      <div className="h-8" />
    </div>
  )
}

// ============ TASKS ADMIN ============
function TasksAdmin({
  tasks,
  onCreate,
  onUpdate,
  onDelete,
}: {
  tasks: Task[]
  onCreate: (task: Omit<Task, "id" | "completed">) => void
  onUpdate: (id: string, task: Partial<Task>) => void
  onDelete: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ title: "", emoji: "" })

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.emoji.trim()) return

    if (editingId) {
      onUpdate(editingId, formData)
      setEditingId(null)
    } else {
      onCreate(formData)
      setIsAdding(false)
    }
    setFormData({ title: "", emoji: "" })
  }

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setFormData({ title: task.title, emoji: task.emoji })
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ title: "", emoji: "" })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Tarefas / Combinados</h2>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
          }}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-white shadow-md transition-all hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {/* Form for adding/editing */}
      {(isAdding || editingId) && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">Emoji</label>
              <input
                type="text"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                placeholder="Ex: 📚"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-2xl focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">Titulo</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Fazer o dever sem brigar"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-bold text-white transition-all hover:bg-emerald-600"
              >
                <Check className="h-4 w-4" />
                {editingId ? "Salvar" : "Adicionar"}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center rounded-xl bg-slate-200 px-4 py-3 font-bold text-slate-600 transition-all hover:bg-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{task.emoji}</span>
              <span className="font-semibold text-slate-700">{task.title}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(task)}
                className="rounded-xl bg-blue-100 p-2 text-blue-600 transition-all hover:bg-blue-200"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="rounded-xl bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ PENALTIES ADMIN ============
function PenaltiesAdmin({
  penalties,
  onCreate,
  onUpdate,
  onDelete,
}: {
  penalties: Penalty[]
  onCreate: (penalty: Omit<Penalty, "id">) => void
  onUpdate: (id: string, penalty: Partial<Penalty>) => void
  onDelete: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ title: "", emoji: "", amount: 1 })

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.emoji.trim()) return

    if (editingId) {
      onUpdate(editingId, formData)
      setEditingId(null)
    } else {
      onCreate(formData)
      setIsAdding(false)
    }
    setFormData({ title: "", emoji: "", amount: 1 })
  }

  const startEdit = (penalty: Penalty) => {
    setEditingId(penalty.id)
    setFormData({ title: penalty.title, emoji: penalty.emoji, amount: penalty.amount })
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ title: "", emoji: "", amount: 1 })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Penalidades</h2>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
          }}
          className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 font-bold text-white shadow-md transition-all hover:bg-red-600"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Emoji</label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="Ex: 😤"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-2xl focus:border-red-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Estrelas perdidas</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number.parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 focus:border-red-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">Titulo</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Brigou ou bateu"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 focus:border-red-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 font-bold text-white transition-all hover:bg-red-600"
              >
                <Check className="h-4 w-4" />
                {editingId ? "Salvar" : "Adicionar"}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center rounded-xl bg-slate-200 px-4 py-3 font-bold text-slate-600 transition-all hover:bg-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {penalties.map((penalty) => (
          <div
            key={penalty.id}
            className="flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{penalty.emoji}</span>
              <div>
                <span className="font-semibold text-slate-700">{penalty.title}</span>
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  -{penalty.amount} estrela{penalty.amount > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(penalty)}
                className="rounded-xl bg-blue-100 p-2 text-blue-600 transition-all hover:bg-blue-200"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(penalty.id)}
                className="rounded-xl bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ REWARDS ADMIN ============
function RewardsAdmin({
  rewards,
  onCreate,
  onUpdate,
  onDelete,
}: {
  rewards: Reward[]
  onCreate: (reward: Omit<Reward, "id">) => void
  onUpdate: (id: string, reward: Partial<Reward>) => void
  onDelete: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ title: "", emoji: "", description: "", cost: 10 })

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.emoji.trim()) return

    if (editingId) {
      onUpdate(editingId, formData)
      setEditingId(null)
    } else {
      onCreate(formData)
      setIsAdding(false)
    }
    setFormData({ title: "", emoji: "", description: "", cost: 10 })
  }

  const startEdit = (reward: Reward) => {
    setEditingId(reward.id)
    setFormData({
      title: reward.title,
      emoji: reward.emoji,
      description: reward.description || "",
      cost: reward.cost,
    })
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ title: "", emoji: "", description: "", cost: 10 })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Loja de Recompensas</h2>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
          }}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-white shadow-md transition-all hover:bg-amber-600"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Emoji</label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="Ex: 🎬"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-2xl focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Custo (estrelas)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: Number.parseInt(e.target.value) || 10 })}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">Titulo</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Escolher o filme"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">Descricao</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Escolha o filme da familia!"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-bold text-white transition-all hover:bg-amber-600"
              >
                <Check className="h-4 w-4" />
                {editingId ? "Salvar" : "Adicionar"}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center rounded-xl bg-slate-200 px-4 py-3 font-bold text-slate-600 transition-all hover:bg-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className="flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{reward.emoji}</span>
              <div>
                <span className="font-semibold text-slate-700">{reward.title}</span>
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600">
                  {reward.cost} estrelas
                </span>
                {reward.description && <p className="text-xs text-slate-500">{reward.description}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(reward)}
                className="rounded-xl bg-blue-100 p-2 text-blue-600 transition-all hover:bg-blue-200"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(reward.id)}
                className="rounded-xl bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ ROUTINES ADMIN ============
function RoutinesAdmin({
  routines,
  onCreate,
  onUpdate,
  onDelete,
}: {
  routines: RoutineItem[]
  onCreate: (routine: Omit<RoutineItem, "id">) => void
  onUpdate: (id: string, routine: Partial<RoutineItem>) => void
  onDelete: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    time: "",
    title: "",
    emoji: "",
    period: "morning" as "morning" | "evening",
  })

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.emoji.trim() || !formData.time.trim()) return

    if (editingId) {
      onUpdate(editingId, formData)
      setEditingId(null)
    } else {
      onCreate(formData)
      setIsAdding(false)
    }
    setFormData({ time: "", title: "", emoji: "", period: "morning" })
  }

  const startEdit = (routine: RoutineItem) => {
    setEditingId(routine.id)
    setFormData({
      time: routine.time,
      title: routine.title,
      emoji: routine.emoji,
      period: routine.period,
    })
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ time: "", title: "", emoji: "", period: "morning" })
  }

  const morningRoutines = routines.filter((r) => r.period === "morning")
  const eveningRoutines = routines.filter((r) => r.period === "evening")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Rotinas</h2>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 font-bold text-white shadow-md transition-all hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Horario</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Emoji</label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="Ex: 🌅"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-2xl focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Periodo</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as "morning" | "evening" })}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="morning">Manha</option>
                  <option value="evening">Noite</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">Titulo</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Acordar"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-bold text-white transition-all hover:bg-indigo-600"
              >
                <Check className="h-4 w-4" />
                {editingId ? "Salvar" : "Adicionar"}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center rounded-xl bg-slate-200 px-4 py-3 font-bold text-slate-600 transition-all hover:bg-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Morning routines */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 p-3">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-700">
          <span>☀️</span> Manha
        </h3>
        <div className="space-y-2">
          {morningRoutines.map((routine) => (
            <div
              key={routine.id}
              className="flex items-center justify-between rounded-xl border-2 border-amber-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                  {routine.time}
                </span>
                <span className="text-xl">{routine.emoji}</span>
                <span className="font-semibold text-slate-700">{routine.title}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(routine)}
                  className="rounded-xl bg-blue-100 p-2 text-blue-600 transition-all hover:bg-blue-200"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(routine.id)}
                  className="rounded-xl bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evening routines */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-100 to-purple-100 p-3">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-700">
          <span>🌙</span> Tarde / Noite
        </h3>
        <div className="space-y-2">
          {eveningRoutines.map((routine) => (
            <div
              key={routine.id}
              className="flex items-center justify-between rounded-xl border-2 border-indigo-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700">
                  {routine.time}
                </span>
                <span className="text-xl">{routine.emoji}</span>
                <span className="font-semibold text-slate-700">{routine.title}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(routine)}
                  className="rounded-xl bg-blue-100 p-2 text-blue-600 transition-all hover:bg-blue-200"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(routine.id)}
                  className="rounded-xl bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
