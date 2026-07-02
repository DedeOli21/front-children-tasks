"use client"

import { useState } from "react"
import { Check, RotateCcw, Sparkles } from "lucide-react"
import type { Task } from "@/lib/api"

interface TaskListProps {
  tasks: Task[]
  completedTasks: string[]
  onTaskComplete: (taskId: string) => void
  // Resetar o dia é ação do responsável; quando ausente, o botão fica oculto
  onResetDay?: () => void
  childName?: string
}

export function TaskList({ tasks, completedTasks, onTaskComplete, onResetDay, childName }: TaskListProps) {
  const [animatingTask, setAnimatingTask] = useState<string | null>(null)

  const handleTaskClick = (taskId: string) => {
    if (!completedTasks.includes(taskId)) {
      setAnimatingTask(taskId)
      setTimeout(() => {
        onTaskComplete(taskId)
        setAnimatingTask(null)
      }, 300)
    }
  }

  const completedCount = completedTasks.length
  const totalTasks = tasks.length

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Progresso de hoje</p>
            <p className="text-xl font-bold text-foreground">
              {completedCount}/{totalTasks} combinados
            </p>
          </div>
        </div>
        {onResetDay && (
          <button
            onClick={onResetDay}
            className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Resetar</span>
          </button>
        )}
      </div>

      {/* Task Cards - Use tasks from props */}
      <div className="space-y-3">
        {tasks.map((task, index) => {
          const isCompleted = completedTasks.includes(task.id)
          const isAnimating = animatingTask === task.id

          return (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task.id)}
              disabled={isCompleted}
              className={`group relative w-full overflow-hidden rounded-2xl p-4 text-left shadow-lg transition-all duration-300 ${
                isCompleted
                  ? "bg-gradient-to-r from-emerald-100 to-green-100 ring-2 ring-primary"
                  : "bg-card hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              } ${isAnimating ? "animate-pop-in" : ""}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                {/* Checkbox */}
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-3 transition-all duration-300 ${
                    isCompleted
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30 bg-muted group-hover:border-primary/50 group-hover:bg-primary/10"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-8 w-8 text-primary-foreground" strokeWidth={3} />
                  ) : (
                    <span className="text-3xl">{task.emoji}</span>
                  )}
                </div>

                {/* Task Label - Use task.title instead of task.label */}
                <div className="flex-1">
                  <p
                    className={`text-lg font-bold transition-colors ${
                      isCompleted ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </p>
                  <p
                    className={`text-sm ${
                      isCompleted && task.status !== "approved"
                        ? "font-semibold text-amber-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {!isCompleted
                      ? "Toque para completar"
                      : task.status === "approved"
                        ? "Aprovada! +1 estrela"
                        : "Aguardando o chefe aprovar! 🕐"}
                  </p>
                </div>

                {/* Indicador: estrela quando aprovada, relógio enquanto aguarda */}
                {isCompleted && (
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md ${
                      task.status === "approved" ? "bg-yellow-400" : "bg-amber-200"
                    }`}
                  >
                    <span className="text-xl">{task.status === "approved" ? "⭐" : "🕐"}</span>
                  </div>
                )}
              </div>

              {/* Completion overlay animation */}
              {isAnimating && <div className="absolute inset-0 animate-pulse bg-primary/20" />}
            </button>
          )
        })}
      </div>

      {/* Completion Message */}
      {completedCount === totalTasks && totalTasks > 0 && (
        <div className="animate-pop-in rounded-2xl bg-gradient-to-r from-primary to-emerald-500 p-6 text-center shadow-xl">
          <p className="text-2xl font-black text-white">Parabéns{childName ? `, ${childName}` : ""}!</p>
          <p className="mt-2 text-lg font-semibold text-white/90">Você completou todos os combinados de hoje!</p>
        </div>
      )}
    </div>
  )
}
