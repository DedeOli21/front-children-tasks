"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Inbox,
  LayoutTemplate,
  Loader2,
  Plus,
  Star,
  X,
  CheckCircle2,
  CalendarDays,
  GripVertical,
  Trash2,
} from "lucide-react";
import {
  missionsApi,
  templatesApi,
  tasksApi,
  starsApi,
  proactiveRequestsApi,
  activeTasksApi,
  type Mission,
  type RoutineTemplate,
  type PendingTaskApproval,
  type StarRequest,
  type ProactiveRequest,
  type Child,
  type ActiveTask,
} from "@/lib/api";
import { SmartTaskInput } from "@/components/parent/smart-task-input";
import { TaskTemplateComposer } from "@/components/parent/task-template-composer";

// Item selecionado no painel lateral, aguardando um clique/drop em um dia
type Selection =
  { type: "mission"; id: string } | { type: "template"; id: string } | null;

const proactiveCategoryLabel: Record<ProactiveRequest["categoryIcon"], string> =
  {
    studies: "Estudos",
    organization: "Organização",
  };

interface RoutinePlannerProps {
  children: Child[];
  selectedChildId: string | null;
  initialView?: "plan" | "review";
  // Notifica o dashboard quando uma aprovação altera o saldo de estrelas
  onStarsChanged: (childId: string, stars: number) => void;
  onPlanningChanged?: () => void;
}

// Próximos 7 dias a partir de hoje
function buildWeek(): {
  date: string;
  weekday: string;
  dayLabel: string;
  isToday: boolean;
}[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().split("T")[0];
    return {
      date,
      weekday: d
        .toLocaleDateString("pt-BR", { weekday: "long" })
        .replace("-feira", ""),
      dayLabel: d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      isToday: i === 0,
    };
  });
}

export function RoutinePlanner({
  children,
  selectedChildId,
  initialView = "plan",
  onStarsChanged,
  onPlanningChanged,
}: RoutinePlannerProps) {
  const [view, setView] = useState<"plan" | "review">(initialView);
  const [isLoading, setIsLoading] = useState(true);

  const [inbox, setInbox] = useState<Mission[]>([]);
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [weekMissions, setWeekMissions] = useState<Record<string, Mission[]>>(
    {},
  );
  const [pendingTasks, setPendingTasks] = useState<PendingTaskApproval[]>([]);
  const [pendingActiveTasks, setPendingActiveTasks] = useState<ActiveTask[]>(
    [],
  );
  const [pendingMissions, setPendingMissions] = useState<Mission[]>([]);
  const [pendingStarRequests, setPendingStarRequests] = useState<StarRequest[]>(
    [],
  );
  const [pendingProactiveRequests, setPendingProactiveRequests] = useState<
    ProactiveRequest[]
  >([]);
  const [proactiveStarsById, setProactiveStarsById] = useState<
    Record<string, string>
  >({});

  const [selection, setSelection] = useState<Selection>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const week = useMemo(buildWeek, []);
  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  const loadPlanning = useCallback(async () => {
    const [inboxData, templatesData] = await Promise.all([
      missionsApi.inbox().catch(() => [] as Mission[]),
      templatesApi.list().catch(() => [] as RoutineTemplate[]),
    ]);
    setInbox(inboxData);
    setTemplates(templatesData);
  }, []);

  const loadWeek = useCallback(async () => {
    if (!selectedChildId) {
      setWeekMissions({});
      return;
    }
    const days = buildWeek();
    const results = await Promise.all(
      days.map((day) =>
        missionsApi
          .forDay(day.date, selectedChildId)
          .catch(() => [] as Mission[]),
      ),
    );
    const byDate: Record<string, Mission[]> = {};
    days.forEach((day, i) => {
      byDate[day.date] = results[i];
    });
    setWeekMissions(byDate);
  }, [selectedChildId]);

  const loadReview = useCallback(async () => {
    const [
      tasksData,
      activeTasksData,
      missionsData,
      starRequestsData,
      proactiveRequestsData,
    ] = await Promise.all([
      tasksApi.pendingApproval().catch(() => [] as PendingTaskApproval[]),
      activeTasksApi.pendingApproval().catch(() => [] as ActiveTask[]),
      missionsApi.pendingApproval().catch(() => [] as Mission[]),
      starsApi.listRequests().catch(() => [] as StarRequest[]),
      proactiveRequestsApi.pending().catch(() => [] as ProactiveRequest[]),
    ]);
    setPendingTasks(tasksData);
    setPendingActiveTasks(activeTasksData);
    setPendingMissions(missionsData);
    setPendingStarRequests(starRequestsData);
    setPendingProactiveRequests(proactiveRequestsData);
    setProactiveStarsById((current) => {
      const next = { ...current };
      proactiveRequestsData.forEach((request) => {
        if (next[request.id] === undefined) {
          next[request.id] = String(request.suggestedStars);
        }
      });
      return next;
    });
  }, []);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await Promise.all([loadPlanning(), loadReview()]);
      setIsLoading(false);
    }
    load();
  }, [loadPlanning, loadReview]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  const pendingCount =
    pendingTasks.length +
    pendingActiveTasks.length +
    pendingMissions.length +
    pendingStarRequests.length +
    pendingProactiveRequests.length;

  // ============ ALOCAÇÃO (clique ou drag-and-drop) ============
  const allocateToDay = async (sel: Selection, date: string) => {
    if (!sel) return;
    try {
      if (sel.type === "mission") {
        await missionsApi.allocate(sel.id, date);
        toast.success("Missão alocada no dia! 📅");
        await Promise.all([loadPlanning(), loadWeek()]);
      } else {
        if (!selectedChildId) {
          toast.error("Selecione uma criança para aplicar o template");
          return;
        }
        const result = await templatesApi.instantiate(
          sel.id,
          selectedChildId,
          date,
        );
        toast.success(result.message ?? "Rotina aplicada!");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível alocar",
      );
    } finally {
      setSelection(null);
    }
  };

  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    try {
      allocateToDay(JSON.parse(raw) as Selection, date);
    } catch {
      // payload inválido: ignora o drop
    }
  };

  const handleUnschedule = async (missionId: string) => {
    try {
      await missionsApi.unschedule(missionId);
      toast.success("Missão devolvida para a inbox");
      await Promise.all([loadPlanning(), loadWeek()]);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível devolver a missão",
      );
    }
  };

  // ============ APROVAÇÃO ============
  const handleApproveTask = async (item: PendingTaskApproval) => {
    try {
      const result = await tasksApi.approveLog(item.logId);
      toast.success(result.message);
      onStarsChanged(result.childId, result.currentStars);
      setPendingTasks((prev) => prev.filter((p) => p.logId !== item.logId));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível aprovar",
      );
    }
  };

  const handleApproveActiveTask = async (item: ActiveTask) => {
    try {
      const result = await activeTasksApi.approve(item.id);
      toast.success(result.message);
      onStarsChanged(result.childId, result.currentStars);
      setPendingActiveTasks((prev) => prev.filter((p) => p.id !== item.id));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível aprovar",
      );
    }
  };

  const handleApproveMission = async (mission: Mission) => {
    try {
      const result = await missionsApi.approve(mission.id);
      toast.success(result.message);
      onStarsChanged(result.childId, result.currentStars);
      setPendingMissions((prev) => prev.filter((p) => p.id !== mission.id));
      loadWeek();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível aprovar",
      );
    }
  };

  // Caixa de Aprovação de Estrelas (bonificações da terapeuta)
  const handleApproveStarRequest = async (request: StarRequest) => {
    try {
      const result = await starsApi.approveRequest(request.id);
      toast.success(result.message);
      onStarsChanged(request.childId, result.currentStars);
      setPendingStarRequests((prev) => prev.filter((p) => p.id !== request.id));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível aprovar",
      );
    }
  };

  const handleRejectStarRequest = async (request: StarRequest) => {
    try {
      const result = await starsApi.rejectRequest(request.id);
      toast.success(result.message);
      setPendingStarRequests((prev) => prev.filter((p) => p.id !== request.id));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível recusar",
      );
    }
  };

  const handleApproveProactiveRequest = async (request: ProactiveRequest) => {
    const rawValue =
      proactiveStarsById[request.id] ?? String(request.suggestedStars);
    const finalStars = Number.parseInt(rawValue, 10);
    if (!Number.isInteger(finalStars) || finalStars < 0 || finalStars > 50) {
      toast.error("Informe um valor entre 0 e 50 estrelas");
      return;
    }

    try {
      const result = await proactiveRequestsApi.approve(request.id, finalStars);
      toast.success(result.message);
      onStarsChanged(request.childId, result.currentStars);
      setPendingProactiveRequests((prev) =>
        prev.filter((p) => p.id !== request.id),
      );
      setProactiveStarsById((prev) => {
        const next = { ...prev };
        delete next[request.id];
        return next;
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível aprovar",
      );
    }
  };

  const handleRejectProactiveRequest = async (request: ProactiveRequest) => {
    try {
      const result = await proactiveRequestsApi.reject(request.id);
      toast.success(result.message);
      setPendingProactiveRequests((prev) =>
        prev.filter((p) => p.id !== request.id),
      );
      setProactiveStarsById((prev) => {
        const next = { ...prev };
        delete next[request.id];
        return next;
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível recusar",
      );
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await templatesApi.remove(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      onPlanningChanged?.();
      if (selection?.type === "template" && selection.id === id)
        setSelection(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível remover o template",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-abas: Planejar / Aguardando Revisão */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-2 shadow-lg">
        <button
          onClick={() => setView("plan")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2 font-bold transition-all ${
            view === "plan"
              ? "bg-slate-700 text-white shadow-md"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span className="text-sm">Planejar semana</span>
        </button>
        <button
          onClick={() => {
            setView("review");
            loadReview();
          }}
          className={`relative flex items-center justify-center gap-2 rounded-xl py-2 font-bold transition-all ${
            view === "review"
              ? "bg-amber-500 text-white shadow-md"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">Aguardando revisão</span>
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {view === "review" ? (
        // ============ AGUARDANDO REVISÃO ============
        <div className="space-y-3">
          {pendingCount === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" />
              <p className="mt-2 font-bold text-slate-600">Tudo revisado!</p>
              <p className="mt-1 text-sm text-slate-400">
                Quando a criança marcar uma tarefa ou missão como feita, ela
                aparece aqui.
              </p>
            </div>
          ) : (
            <>
              {pendingActiveTasks.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-lg ring-2 ring-sky-100"
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-700">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.childName} ·{" "}
                      {new Date(`${item.date}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                      )}{" "}
                      · +{item.rewardStars}⭐
                    </p>
                  </div>
                  <button
                    onClick={() => handleApproveActiveTask(item)}
                    className="flex shrink-0 items-center gap-1 rounded-xl bg-sky-500 px-3 py-2 text-sm font-black text-white shadow transition-transform hover:scale-105"
                  >
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    Aprovar
                  </button>
                </div>
              ))}
              {pendingTasks.map((item) => (
                <div
                  key={item.logId}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-lg"
                >
                  <span className="text-3xl">{item.iconEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-700">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.childName} ·{" "}
                      {new Date(`${item.date}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApproveTask(item)}
                    className="flex shrink-0 items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-black text-white shadow transition-transform hover:scale-105"
                  >
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    Aprovar
                  </button>
                </div>
              ))}
              {pendingMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-lg ring-2 ring-violet-100"
                >
                  <span className="text-3xl">{mission.iconEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-700">
                      {mission.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {mission.childName} · Missão de{" "}
                      {mission.teacherName ?? "professor(a)"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApproveMission(mission)}
                    className="flex shrink-0 items-center gap-1 rounded-xl bg-violet-500 px-3 py-2 text-sm font-black text-white shadow transition-transform hover:scale-105"
                  >
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    Aprovar +{mission.starsReward}
                  </button>
                </div>
              ))}
              {/* Bonificações sugeridas pela terapeuta */}
              {pendingStarRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl bg-white p-4 shadow-lg ring-2 ring-purple-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💜</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-700">
                        +{request.amount} estrela(s) para {request.childName}
                      </p>
                      <p className="text-xs text-slate-400">
                        Terapeuta {request.therapistName ?? ""} ·{" "}
                        {new Date(request.createdAt).toLocaleDateString(
                          "pt-BR",
                        )}
                      </p>
                      <p className="mt-1 text-sm italic text-slate-600">
                        &ldquo;{request.reason}&rdquo;
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleRejectStarRequest(request)}
                      className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      Recusar
                    </button>
                    <button
                      onClick={() => handleApproveStarRequest(request)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-purple-500 py-2 text-sm font-black text-white shadow transition-transform hover:scale-[1.02]"
                    >
                      <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                      Aprovar +{request.amount}
                    </button>
                  </div>
                </div>
              ))}
              {/* Super Iniciativas enviadas pela criança */}
              {pendingProactiveRequests.map((request) => {
                const starsValue =
                  proactiveStarsById[request.id] ??
                  String(request.suggestedStars);
                const previewStars = Number.parseInt(starsValue, 10);
                return (
                  <div
                    key={request.id}
                    className="rounded-2xl bg-white p-4 shadow-lg ring-2 ring-emerald-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {request.categoryEmoji ?? "✨"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-700">
                          Super Iniciativa de {request.childName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {proactiveCategoryLabel[request.categoryIcon]} ·{" "}
                          sugeriu +{request.suggestedStars} estrela(s)
                        </p>
                        <p className="mt-1 text-sm italic text-slate-600">
                          &ldquo;{request.description}&rdquo;
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                      <label className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                        <Star className="h-4 w-4 fill-yellow-300 text-yellow-400" />
                        <span className="text-xs font-black uppercase text-emerald-700">
                          Estrelas finais
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={starsValue}
                          onChange={(event) =>
                            setProactiveStarsById((prev) => ({
                              ...prev,
                              [request.id]: event.target.value,
                            }))
                          }
                          className="ml-auto w-16 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-center text-sm font-black text-emerald-700 outline-none focus:border-emerald-400"
                        />
                      </label>
                      <button
                        onClick={() => handleRejectProactiveRequest(request)}
                        className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() => handleApproveProactiveRequest(request)}
                        className="flex items-center justify-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-white shadow transition-transform hover:scale-[1.02]"
                      >
                        <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                        Aprovar +
                        {Number.isInteger(previewStars)
                          ? previewStars
                          : request.suggestedStars}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        // ============ PLANEJAR ============
        <div className="space-y-4">
          <TaskTemplateComposer
            selectedChildId={selectedChildId}
            childName={selectedChild?.name}
            onCreated={() => {
              loadReview();
              onPlanningChanged?.();
            }}
          />

          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            {/* Painel lateral: Inbox + Templates */}
            <div className="space-y-4">
              {/* Inbox */}
              <div className="rounded-2xl bg-white p-4 shadow-lg">
                <div className="mb-2 flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-violet-500" />
                  <h3 className="text-sm font-black text-slate-700">
                    Inbox da escola
                  </h3>
                  {inbox.length > 0 && (
                    <span className="rounded-full bg-violet-100 px-2 text-xs font-bold text-violet-600">
                      {inbox.length}
                    </span>
                  )}
                </div>
                {inbox.length === 0 ? (
                  <p className="py-2 text-xs text-slate-400">
                    Nenhuma missão aguardando alocação.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {inbox.map((mission) => {
                      const isSelected =
                        selection?.type === "mission" &&
                        selection.id === mission.id;
                      return (
                        <button
                          key={mission.id}
                          draggable
                          onDragStart={(e) =>
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({
                                type: "mission",
                                id: mission.id,
                              }),
                            )
                          }
                          onClick={() =>
                            setSelection(
                              isSelected
                                ? null
                                : { type: "mission", id: mission.id },
                            )
                          }
                          className={`flex w-full cursor-grab items-center gap-2 rounded-xl border-2 p-2 text-left transition-all active:cursor-grabbing ${
                            isSelected
                              ? "border-violet-500 bg-violet-50"
                              : "border-slate-100 bg-slate-50 hover:border-violet-200"
                          }`}
                        >
                          <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
                          <span className="text-xl">{mission.iconEmoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-700">
                              {mission.title}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {mission.childName} · {mission.teacherName} · +
                              {mission.starsReward}⭐
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Templates */}
              <div className="rounded-2xl bg-white p-4 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-black text-slate-700">
                      Templates
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-200"
                  >
                    <Plus className="h-3 w-3" />
                    Novo
                  </button>
                </div>
                {templates.length === 0 ? (
                  <p className="py-2 text-xs text-slate-400">
                    Crie templates como &quot;Manhã de Escola&quot; para aplicar
                    num dia com um clique.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => {
                      const isSelected =
                        selection?.type === "template" &&
                        selection.id === template.id;
                      return (
                        <div
                          key={template.id}
                          draggable
                          onDragStart={(e) =>
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({
                                type: "template",
                                id: template.id,
                              }),
                            )
                          }
                          onClick={() =>
                            setSelection(
                              isSelected
                                ? null
                                : { type: "template", id: template.id },
                            )
                          }
                          className={`flex w-full cursor-grab items-center gap-2 rounded-xl border-2 p-2 text-left transition-all active:cursor-grabbing ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-100 bg-slate-50 hover:border-emerald-200"
                          }`}
                        >
                          <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
                          <span className="text-xl">{template.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-700">
                              {template.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {template.tasks.length} tarefa(s)
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className="shrink-0 rounded-lg bg-red-50 p-1.5 text-red-400 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selection && (
                <div className="rounded-xl bg-blue-50 p-3 text-center text-xs font-semibold text-blue-700">
                  {selection.type === "mission"
                    ? "Missão selecionada"
                    : "Template selecionado"}{" "}
                  — toque em um dia da semana para alocar (ou arraste).
                </div>
              )}
            </div>

            {/* Semana */}
            <div className="space-y-2">
              {!selectedChild && (
                <div className="rounded-xl bg-amber-50 p-3 text-center text-sm font-semibold text-amber-700">
                  Selecione uma criança acima para ver e planejar a semana dela.
                </div>
              )}
              {week.map((day) => {
                const missions = weekMissions[day.date] ?? [];
                return (
                  <div
                    key={day.date}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, day.date)}
                    onClick={() =>
                      selection && allocateToDay(selection, day.date)
                    }
                    className={`rounded-2xl border-2 bg-white p-3 shadow-md transition-all ${
                      selection
                        ? "cursor-pointer border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                        : "border-transparent"
                    } ${day.isToday ? "ring-2 ring-emerald-200" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black capitalize text-slate-700">
                        {day.weekday}{" "}
                        <span className="font-semibold text-slate-400">
                          {day.dayLabel}
                        </span>
                      </p>
                      {day.isToday && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          hoje
                        </span>
                      )}
                    </div>
                    {missions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {missions.map((mission) => (
                          <span
                            key={mission.id}
                            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                              mission.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : mission.status === "completed"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-violet-100 text-violet-700"
                            }`}
                          >
                            {mission.iconEmoji} {mission.title}
                            {mission.status === "scheduled" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnschedule(mission.id);
                                }}
                                className="rounded-full hover:bg-violet-200"
                                title="Devolver para a inbox"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <CreateTemplateModal
          onClose={() => setShowTemplateModal(false)}
          onCreated={(template) => {
            setTemplates((prev) => [...prev, template]);
            setShowTemplateModal(false);
            toast.success(`Template "${template.name}" criado!`);
          }}
        />
      )}
    </div>
  );
}

// ============ MODAL DE NOVO TEMPLATE ============
interface CreateTemplateModalProps {
  onClose: () => void;
  onCreated: (template: RoutineTemplate) => void;
}

function CreateTemplateModal({ onClose, onCreated }: CreateTemplateModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🗓️");
  const [items, setItems] = useState<
    { title: string; iconEmoji: string; scheduledTime: string }[]
  >([{ title: "", iconEmoji: "⭐", scheduledTime: "" }]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateItem = (
    index: number,
    patch: Partial<(typeof items)[number]>,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const tasks = items
      .filter((item) => item.title.trim())
      .map((item, index) => ({
        title: item.title.trim(),
        iconEmoji: item.iconEmoji || "⭐",
        scheduledTime: item.scheduledTime || undefined,
        sortOrder: index,
      }));
    if (tasks.length === 0) {
      setError("Adicione pelo menos uma tarefa");
      return;
    }
    if (!name.trim()) {
      setError("Informe o nome do template");
      return;
    }
    setIsSaving(true);
    try {
      const created = await templatesApi.create({
        name: name.trim(),
        emoji,
        tasks,
      });
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-700">
            Novo template de rotina
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-3 text-center text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-16 rounded-xl border-2 border-slate-200 bg-slate-50 px-2 py-3 text-center text-xl focus:border-emerald-400 focus:outline-none"
            />
            <SmartTaskInput
              title={name}
              emoji={emoji}
              onTitleChange={setName}
              onEmojiChange={setEmoji}
              placeholder="Nome (ex: Manha de Escola)"
              required
              className="flex-1"
              inputClassName="rounded-xl bg-slate-50 font-semibold focus:border-emerald-400"
              suggestionClassName="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            />
          </div>

          <p className="text-xs font-bold uppercase text-slate-400">
            Tarefas do template
          </p>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item.iconEmoji}
                onChange={(e) =>
                  updateItem(index, { iconEmoji: e.target.value })
                }
                className="w-14 rounded-xl border-2 border-slate-200 bg-slate-50 px-1 py-2 text-center focus:border-emerald-400 focus:outline-none"
              />
              <SmartTaskInput
                title={item.title}
                emoji={item.iconEmoji}
                onTitleChange={(title) => updateItem(index, { title })}
                onEmojiChange={(iconEmoji) => updateItem(index, { iconEmoji })}
                placeholder={`Tarefa ${index + 1}`}
                className="flex-1"
                inputClassName="h-10 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-emerald-400"
                suggestionClassName="h-7 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              />
              <input
                type="time"
                value={item.scheduledTime}
                onChange={(e) =>
                  updateItem(index, { scheduledTime: e.target.value })
                }
                className="w-24 rounded-xl border-2 border-slate-200 bg-slate-50 px-1 py-2 text-xs font-semibold text-slate-600 focus:border-emerald-400 focus:outline-none"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setItems((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="shrink-0 rounded-xl bg-red-50 px-2 text-red-400 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                { title: "", iconEmoji: "⭐", scheduledTime: "" },
              ])
            }
            className="flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 py-2 text-sm font-bold text-slate-400 hover:border-emerald-400 hover:text-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Adicionar tarefa
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-black text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            Salvar template
          </button>
        </form>
      </div>
    </div>
  );
}
