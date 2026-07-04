"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Gift,
  HeartHandshake,
  Inbox,
  PiggyBank,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react"
import { HistoryReport } from "@/components/admin/history-report"
import { MysteryPrizesAdmin } from "@/components/admin/mystery-prizes-admin"
import { PenaltiesAdmin, RewardsAdmin, TasksAdmin } from "@/components/admin/admin-dashboard"
import { RoutineManager } from "@/components/parent/routine-manager"
import { RoutinePlanner } from "@/components/parent/routine-planner"
import { SmartTaskInput } from "@/components/parent/smart-task-input"
import { WeeklyAgenda } from "@/components/parent/weekly-agenda"
import {
  eventsApi,
  goalsApi,
  type Child,
  type FamilyGoal,
  type MysteryPrize,
  type Penalty,
  type Reward,
  type RoutineItem,
  type Task,
  type TherapistLink,
} from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

type HubTab = "approvals" | "planning" | "economy" | "support" | "history"
type EconomyTab = "shop" | "rules" | "shared" | "mystery"

interface ControlHubProps {
  childrenList: Child[]
  selectedChild: Child | null
  selectedChildId: string | null
  tasks: Task[]
  penalties: Penalty[]
  rewards: Reward[]
  routines: RoutineItem[]
  mysteryPrizes: MysteryPrize[]
  therapists: TherapistLink[]
  onBack: () => void
  onStarsChanged: (childId: string, stars: number) => void
  onTaskCreate: (task: Omit<Task, "id" | "completed">) => void | Promise<void>
  onTaskUpdate: (id: string, task: Partial<Task>) => void | Promise<void>
  onTaskDelete: (id: string) => void | Promise<void>
  onPenaltyCreate: (penalty: Omit<Penalty, "id">) => void | Promise<void>
  onPenaltyUpdate: (id: string, penalty: Partial<Penalty>) => void | Promise<void>
  onPenaltyDelete: (id: string) => void | Promise<void>
  onRewardCreate: (reward: Omit<Reward, "id">) => void | Promise<void>
  onRewardUpdate: (id: string, reward: Partial<Reward>) => void | Promise<void>
  onRewardDelete: (id: string) => void | Promise<void>
  onRoutineCreate: (routine: Omit<RoutineItem, "id">) => void | Promise<void>
  onRoutineUpdate: (id: string, routine: Partial<RoutineItem>) => void | Promise<void>
  onRoutineDelete: (id: string) => void | Promise<void>
  onMysteryPrizeCreate: (prize: Omit<MysteryPrize, "id">) => void | Promise<void>
  onMysteryPrizeUpdate: (id: string, prize: Partial<MysteryPrize>) => void | Promise<void>
  onMysteryPrizeDelete: (id: string) => void | Promise<void>
  onAddTherapist: () => void
  onUnlinkTherapist: (therapistId: string, childId: string) => void | Promise<void>
}

export function ControlHub({
  childrenList,
  selectedChild,
  selectedChildId,
  tasks,
  penalties,
  rewards,
  routines,
  mysteryPrizes,
  therapists,
  onBack,
  onStarsChanged,
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
  onAddTherapist,
  onUnlinkTherapist,
}: ControlHubProps) {
  const [activeTab, setActiveTab] = useState<HubTab>("approvals")
  const [economyTab, setEconomyTab] = useState<EconomyTab>("shop")
  const [agendaRefreshKey, setAgendaRefreshKey] = useState(0)

  const tabs: { id: HubTab; label: string; icon: typeof Inbox }[] = [
    { id: "approvals", label: "Aprovações", icon: Inbox },
    { id: "planning", label: "Planejamento", icon: CalendarDays },
    { id: "economy", label: "Economia", icon: Gift },
    { id: "support", label: "Equipe", icon: Users },
    { id: "history", label: "Histórico", icon: BarChart3 },
  ]

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black text-slate-800">Hub de Controle</h1>
            <p className="truncate text-xs font-semibold text-slate-500">
              {selectedChild ? `Gerenciando ${selectedChild.name}` : "Selecione uma criança no painel da família"}
            </p>
          </div>
        </div>
      </header>

      <nav className="sticky top-[65px] z-30 mx-4 mt-3 grid grid-cols-5 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-black transition-colors sm:text-xs ${
              activeTab === id ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      <section className="space-y-4 px-4 py-5">
        {activeTab === "approvals" && (
          <RoutinePlanner
            key="hub-approvals"
            children={childrenList}
            selectedChildId={selectedChildId}
            initialView="review"
            onStarsChanged={onStarsChanged}
          />
        )}

        {activeTab === "planning" && (
          <div className="space-y-5">
            <WeeklyAgenda
              selectedChildId={selectedChildId}
              routines={routines}
              refreshKey={agendaRefreshKey}
            />
            <RoutineManager
              selectedChildId={selectedChildId}
              childName={selectedChild?.name}
              routines={routines}
              onCreate={onRoutineCreate}
              onUpdate={onRoutineUpdate}
              onDelete={onRoutineDelete}
            />
            <RoutinePlanner
              key="hub-planning"
              children={childrenList}
              selectedChildId={selectedChildId}
              initialView="plan"
              onStarsChanged={onStarsChanged}
              onPlanningChanged={() =>
                setAgendaRefreshKey((current) => current + 1)
              }
            />
            <TasksAdmin tasks={tasks} onCreate={onTaskCreate} onUpdate={onTaskUpdate} onDelete={onTaskDelete} />
          </div>
        )}

        {activeTab === "economy" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {(
                [
                  { id: "shop", label: "Loja" },
                  { id: "rules", label: "Penalidades" },
                  { id: "shared", label: "Cofrinho" },
                  { id: "mystery", label: "Caixa" },
                ] as { id: EconomyTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setEconomyTab(tab.id)}
                  className={`rounded-lg px-2 py-2 text-xs font-black transition-colors ${
                    economyTab === tab.id ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {economyTab === "shop" && (
              <RewardsAdmin rewards={rewards} onCreate={onRewardCreate} onUpdate={onRewardUpdate} onDelete={onRewardDelete} />
            )}
            {economyTab === "rules" && (
              <PenaltiesAdmin
                penalties={penalties}
                onCreate={onPenaltyCreate}
                onUpdate={onPenaltyUpdate}
                onDelete={onPenaltyDelete}
              />
            )}
            {economyTab === "shared" && (
              <SharedEconomyPanel selectedChild={selectedChild} onStarsChanged={onStarsChanged} />
            )}
            {economyTab === "mystery" && (
              <MysteryPrizesAdmin
                prizes={mysteryPrizes}
                onCreate={onMysteryPrizeCreate}
                onUpdate={onMysteryPrizeUpdate}
                onDelete={onMysteryPrizeDelete}
              />
            )}
          </div>
        )}

        {activeTab === "support" && (
          <SupportTeamPanel
            selectedChild={selectedChild}
            therapists={therapists}
            onAddTherapist={onAddTherapist}
            onUnlinkTherapist={onUnlinkTherapist}
          />
        )}

        {activeTab === "history" && <HistoryReport childId={selectedChildId ?? undefined} />}
      </section>
    </main>
  )
}

function SharedEconomyPanel({
  selectedChild,
  onStarsChanged,
}: {
  selectedChild: Child | null
  onStarsChanged: (childId: string, stars: number) => void
}) {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split("T")[0]
  const [goalForm, setGoalForm] = useState({ title: "", emoji: "🎯", targetStars: 50, description: "" })
  const [eventForm, setEventForm] = useState({
    name: "Estrelas em Dobro",
    emoji: "✨",
    multiplier: 2,
    startsAt: today,
    endsAt: today,
  })
  const [depositByGoal, setDepositByGoal] = useState<Record<string, string>>({})

  const goalsQuery = useQuery({
    queryKey: queryKeys.goals,
    queryFn: goalsApi.list,
  })
  const eventsQuery = useQuery({
    queryKey: queryKeys.events,
    queryFn: eventsApi.list,
  })

  const createGoal = useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      toast.success("Meta criada no cofrinho")
      setGoalForm({ title: "", emoji: "🎯", targetStars: 50, description: "" })
      queryClient.invalidateQueries({ queryKey: queryKeys.goals })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Não foi possível criar a meta"),
  })

  const depositGoal = useMutation({
    mutationFn: ({ goalId, amount }: { goalId: string; amount: number }) =>
      goalsApi.deposit(goalId, { childId: selectedChild?.id, amount }),
    onSuccess: (result) => {
      toast.success(result.message)
      if (selectedChild) onStarsChanged(selectedChild.id, result.currentStars)
      queryClient.invalidateQueries({ queryKey: queryKeys.goals })
      queryClient.invalidateQueries({ queryKey: queryKeys.children })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Não foi possível depositar"),
  })

  const completeGoal = useMutation({
    mutationFn: goalsApi.complete,
    onSuccess: (result) => {
      toast.success(result.message)
      queryClient.invalidateQueries({ queryKey: queryKeys.goals })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Não foi possível concluir"),
  })

  const cancelGoal = useMutation({
    mutationFn: goalsApi.cancel,
    onSuccess: (result) => {
      toast.success(result.message)
      queryClient.invalidateQueries({ queryKey: queryKeys.goals })
      queryClient.invalidateQueries({ queryKey: queryKeys.children })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Não foi possível cancelar"),
  })

  const createEvent = useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      toast.success("Evento surpresa ativado")
      queryClient.invalidateQueries({ queryKey: queryKeys.events })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Não foi possível criar o evento"),
  })

  const deactivateEvent = useMutation({
    mutationFn: eventsApi.deactivate,
    onSuccess: (result) => {
      toast.success(result.message)
      queryClient.invalidateQueries({ queryKey: queryKeys.events })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Não foi possível encerrar o evento"),
  })

  const submitGoal = (event: React.FormEvent) => {
    event.preventDefault()
    if (!goalForm.title.trim()) return
    createGoal.mutate({
      title: goalForm.title.trim(),
      emoji: goalForm.emoji || "🎯",
      description: goalForm.description.trim() || undefined,
      targetStars: goalForm.targetStars,
    })
  }

  const submitEvent = (event: React.FormEvent) => {
    event.preventDefault()
    if (!eventForm.name.trim()) return
    createEvent.mutate({
      name: eventForm.name.trim(),
      emoji: eventForm.emoji || "✨",
      multiplier: eventForm.multiplier,
      startsAt: eventForm.startsAt,
      endsAt: eventForm.endsAt,
    })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-emerald-600" />
            <h2 className="font-black text-slate-800">Cofrinho Compartilhado</h2>
          </div>
          <form onSubmit={submitGoal} className="grid gap-2 sm:grid-cols-[70px_1fr_120px_auto]">
            <input
              value={goalForm.emoji}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, emoji: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-center text-xl"
            />
            <SmartTaskInput
              title={goalForm.title}
              emoji={goalForm.emoji}
              onTitleChange={(title) => setGoalForm((prev) => ({ ...prev, title }))}
              onEmojiChange={(emoji) => setGoalForm((prev) => ({ ...prev, emoji }))}
              placeholder="Ex: Passeio no fim de semana"
              inputClassName="h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-emerald-400"
              suggestionClassName="h-7 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            />
            <input
              type="number"
              min={5}
              value={goalForm.targetStars}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, targetStars: Number(e.target.value) || 5 }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400"
            />
            <button className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-black text-white">
              <Plus className="h-4 w-4" />
              Criar
            </button>
          </form>
        </div>

        {(goalsQuery.data ?? []).map((goal: FamilyGoal) => {
          const percent = Math.min(100, Math.round((goal.depositedStars / goal.targetStars) * 100))
          const depositValue = depositByGoal[goal.id] ?? ""
          return (
            <div key={goal.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{goal.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate font-black text-slate-800">{goal.title}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-black ${
                        goal.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : goal.status === "cancelled"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {goal.depositedStars}/{goal.targetStars} estrelas
                  </p>
                </div>
              </div>

              {goal.status === "active" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    type="number"
                    min={1}
                    value={depositValue}
                    onChange={(e) => setDepositByGoal((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                    placeholder="Estrelas"
                    className="h-10 w-28 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-emerald-400"
                  />
                  <button
                    disabled={!selectedChild}
                    onClick={() => {
                      const amount = Number(depositValue)
                      if (amount > 0) depositGoal.mutate({ goalId: goal.id, amount })
                    }}
                    className="inline-flex h-10 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-sm font-black text-white disabled:opacity-40"
                  >
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    Depositar
                  </button>
                  <button
                    onClick={() => completeGoal.mutate(goal.id)}
                    disabled={goal.depositedStars < goal.targetStars}
                    className="inline-flex h-10 items-center gap-1 rounded-lg bg-slate-800 px-3 text-sm font-black text-white disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir
                  </button>
                  <button
                    onClick={() => cancelGoal.mutate(goal.id)}
                    className="inline-flex h-10 items-center gap-1 rounded-lg bg-red-50 px-3 text-sm font-black text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="font-black text-slate-800">Eventos Surpresa</h2>
          </div>
          <form onSubmit={submitEvent} className="grid gap-2 sm:grid-cols-[70px_1fr_90px]">
            <input
              value={eventForm.emoji}
              onChange={(e) => setEventForm((prev) => ({ ...prev, emoji: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-center text-xl"
            />
            <SmartTaskInput
              title={eventForm.name}
              emoji={eventForm.emoji}
              onTitleChange={(name) => setEventForm((prev) => ({ ...prev, name }))}
              onEmojiChange={(emoji) => setEventForm((prev) => ({ ...prev, emoji }))}
              placeholder="Estrelas em Dobro"
              inputClassName="h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-amber-400"
              suggestionClassName="h-7 bg-amber-100 text-amber-700 hover:bg-amber-200"
            />
            <select
              value={eventForm.multiplier}
              onChange={(e) => setEventForm((prev) => ({ ...prev, multiplier: Number(e.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black outline-none focus:border-amber-400"
            >
              <option value={2}>2x</option>
              <option value={3}>3x</option>
            </select>
            <input
              type="date"
              value={eventForm.startsAt}
              onChange={(e) => setEventForm((prev) => ({ ...prev, startsAt: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-amber-400"
            />
            <input
              type="date"
              value={eventForm.endsAt}
              onChange={(e) => setEventForm((prev) => ({ ...prev, endsAt: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-amber-400"
            />
            <button className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-black text-white">
              <Plus className="h-4 w-4" />
              Ativar
            </button>
          </form>
        </div>

        {(eventsQuery.data ?? []).map((event) => (
          <div key={event.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-3xl">{event.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-slate-800">
                {event.name} · {event.multiplier}x
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {event.startsAt} até {event.endsAt}
              </p>
            </div>
            {event.active && (
              <button
                onClick={() => deactivateEvent.mutate(event.id)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-200"
              >
                Encerrar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SupportTeamPanel({
  selectedChild,
  therapists,
  onAddTherapist,
  onUnlinkTherapist,
}: {
  selectedChild: Child | null
  therapists: TherapistLink[]
  onAddTherapist: () => void
  onUnlinkTherapist: (therapistId: string, childId: string) => void | Promise<void>
}) {
  const linked = selectedChild ? therapists.filter((therapist) => therapist.childId === selectedChild.id) : []

  if (!selectedChild) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-700">
        Selecione uma criança para gerenciar a equipe de apoio.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HeartHandshake className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="font-black text-indigo-900">Equipe de Apoio de {selectedChild.name}</h2>
              <p className="text-sm font-semibold text-indigo-700">Código escolar: {selectedChild.inviteCode}</p>
            </div>
          </div>
          <button
            onClick={onAddTherapist}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-black text-white"
          >
            <Plus className="h-4 w-4" />
            Vincular terapeuta
          </button>
        </div>
      </div>

      {linked.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-600">Nenhuma terapeuta vinculada.</p>
          <p className="mt-1 text-sm text-slate-400">Terapeutas vinculadas podem registrar notas e sugerir bonificações.</p>
        </div>
      ) : (
        linked.map((link) => (
          <div key={`${link.therapistId}-${link.childId}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-3xl">💜</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-slate-800">{link.name}</p>
              <p className="truncate text-sm font-semibold text-slate-500">{link.email}</p>
            </div>
            <button
              onClick={() => onUnlinkTherapist(link.therapistId, link.childId)}
              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100"
            >
              Remover
            </button>
          </div>
        ))
      )}
    </div>
  )
}
