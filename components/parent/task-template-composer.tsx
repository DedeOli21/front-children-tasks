"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Loader2,
  Minus,
  Plus,
  Repeat2,
  Rocket,
  School,
  Star,
  Umbrella,
} from "lucide-react";
import { toast } from "sonner";
import {
  taskTemplatesApi,
  type RecurrenceDay,
  type TaskTemplate,
  type TaskType,
} from "@/lib/api";
import { SmartTaskInput } from "@/components/parent/smart-task-input";

const WEEK_DAYS: { key: RecurrenceDay; short: string; label: string }[] = [
  { key: "sunday", short: "D", label: "Domingo" },
  { key: "monday", short: "S", label: "Segunda" },
  { key: "tuesday", short: "T", label: "Terça" },
  { key: "wednesday", short: "Q", label: "Quarta" },
  { key: "thursday", short: "Q", label: "Quinta" },
  { key: "friday", short: "S", label: "Sexta" },
  { key: "saturday", short: "S", label: "Sábado" },
];

const SCHOOL_DAYS: RecurrenceDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];
const WEEKEND_DAYS: RecurrenceDay[] = ["saturday", "sunday"];

function todayInputValue() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

interface TaskTemplateComposerProps {
  selectedChildId: string | null;
  childName?: string;
  onCreated?: (template: TaskTemplate) => void;
}

export function TaskTemplateComposer({
  selectedChildId,
  childName,
  onCreated,
}: TaskTemplateComposerProps) {
  const [taskType, setTaskType] = useState<TaskType>("fixed");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [rewardStars, setRewardStars] = useState(1);
  const [recurrenceDays, setRecurrenceDays] =
    useState<RecurrenceDay[]>(SCHOOL_DAYS);
  const [scheduledDate, setScheduledDate] = useState(todayInputValue());
  const [isSaving, setIsSaving] = useState(false);

  const selectedDays = useMemo(() => new Set(recurrenceDays), [recurrenceDays]);

  const toggleDay = (day: RecurrenceDay) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day],
    );
  };

  const reset = () => {
    setTitle("");
    setEmoji("⭐");
    setRewardStars(1);
    setRecurrenceDays(SCHOOL_DAYS);
    setScheduledDate(todayInputValue());
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedChildId) {
      toast.error("Selecione uma criança");
      return;
    }
    if (!title.trim()) {
      toast.error("Informe o nome da tarefa");
      return;
    }
    if (taskType === "fixed" && recurrenceDays.length === 0) {
      toast.error("Selecione pelo menos um dia");
      return;
    }

    setIsSaving(true);
    try {
      const created = await taskTemplatesApi.create({
        childId: selectedChildId,
        title: title.trim(),
        emoji,
        rewardStars,
        taskType,
        recurrenceDays: taskType === "fixed" ? recurrenceDays : [],
        scheduledDate: taskType === "extra" ? scheduledDate : undefined,
      });
      toast.success(
        taskType === "fixed"
          ? "Hábito recorrente salvo"
          : "Missão extra agendada",
      );
      onCreated?.(created);
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-slate-100 sm:p-5"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTaskType("fixed")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-colors ${
                taskType === "fixed"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Repeat2 className="h-4 w-4" />
              Hábitos
            </button>
            <button
              type="button"
              onClick={() => setTaskType("extra")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-colors ${
                taskType === "extra"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Rocket className="h-4 w-4" />
              Extras
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-amber-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <button
              type="button"
              onClick={() => setRewardStars((value) => Math.max(1, value - 1))}
              className="rounded-full bg-white p-1 shadow-sm hover:bg-amber-100"
              aria-label="Diminuir estrelas"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-sm font-black">
              {rewardStars}
            </span>
            <button
              type="button"
              onClick={() => setRewardStars((value) => Math.min(20, value + 1))}
              className="rounded-full bg-white p-1 shadow-sm hover:bg-amber-100"
              aria-label="Aumentar estrelas"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[72px_1fr]">
          <input
            type="text"
            value={emoji}
            onChange={(event) => setEmoji(event.target.value)}
            className="h-12 rounded-2xl border-2 border-slate-200 bg-white px-2 text-center text-2xl outline-none transition-colors focus:border-sky-400"
            aria-label="Emoji da tarefa"
          />
          <SmartTaskInput
            title={title}
            emoji={emoji}
            onTitleChange={setTitle}
            onEmojiChange={setEmoji}
            placeholder={
              taskType === "fixed"
                ? "Ex: Escovar os dentes"
                : "Ex: Guardar a mochila"
            }
          />
        </div>

        <AnimatePresence mode="wait">
          {taskType === "fixed" ? (
            <motion.div
              key="fixed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-3 xl:flex-row xl:items-center"
            >
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => {
                  const isSelected = selectedDays.has(day.key);
                  return (
                    <motion.button
                      key={day.key}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => toggleDay(day.key)}
                      title={day.label}
                      aria-pressed={isSelected}
                      className={`h-11 w-11 rounded-full text-sm font-black transition-colors ${
                        isSelected
                          ? "bg-sky-500 text-white shadow-md"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {day.short}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRecurrenceDays(SCHOOL_DAYS)}
                  className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-200"
                >
                  <School className="h-4 w-4" />
                  Dias de aula
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceDays(WEEKEND_DAYS)}
                  className="flex items-center gap-2 rounded-full bg-orange-100 px-3 py-2 text-xs font-black text-orange-700 transition-colors hover:bg-orange-200"
                >
                  <Umbrella className="h-4 w-4" />
                  Fim de semana
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="extra"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <div className="flex h-12 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 text-slate-500">
                <CalendarDays className="h-4 w-4" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={isSaving || !selectedChildId}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white shadow-lg transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          {taskType === "fixed"
            ? "Criar hábito recorrente"
            : "Criar missão extra"}
        </button>

        {!selectedChildId && (
          <p className="text-center text-xs font-bold text-amber-600">
            Selecione uma criança para continuar
          </p>
        )}
        {selectedChildId && childName && (
          <p className="text-center text-xs font-bold text-slate-400">
            Cronograma de {childName}
          </p>
        )}
      </form>
    </motion.section>
  );
}
