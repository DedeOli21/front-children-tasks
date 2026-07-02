import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { TaskList } from "@/components/task-list"
import type { Task } from "@/lib/api"

const TASKS: Task[] = [
  { id: "t1", title: "Escovar os dentes", emoji: "🪥", completed: false, status: "pending" },
  { id: "t2", title: "Arrumar a cama", emoji: "🛏️", completed: true, status: "completed" },
  { id: "t3", title: "Fazer o dever", emoji: "📚", completed: true, status: "approved" },
]

describe("TaskList (fluxo de aprovação)", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("mostra o estado certo para cada status", () => {
    render(
      <TaskList
        tasks={TASKS}
        completedTasks={["t2", "t3"]}
        onTaskComplete={vi.fn()}
      />,
    )

    // Pendente: convite para completar
    expect(screen.getByText("Toque para completar")).toBeInTheDocument()
    // Concluída pela criança: aguarda o responsável, sem creditar estrela
    expect(screen.getByText("Aguardando o chefe aprovar! 🕐")).toBeInTheDocument()
    // Aprovada: estrela liberada
    expect(screen.getByText("Aprovada! +1 estrela")).toBeInTheDocument()
  })

  it("clicar numa tarefa pendente dispara onTaskComplete após a animação", () => {
    vi.useFakeTimers()
    const onTaskComplete = vi.fn()
    render(<TaskList tasks={TASKS} completedTasks={["t2", "t3"]} onTaskComplete={onTaskComplete} />)

    fireEvent.click(screen.getByText("Escovar os dentes"))
    expect(onTaskComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onTaskComplete).toHaveBeenCalledWith("t1")
  })

  it("tarefas já completadas não podem ser clicadas de novo", () => {
    const onTaskComplete = vi.fn()
    render(<TaskList tasks={TASKS} completedTasks={["t2", "t3"]} onTaskComplete={onTaskComplete} />)

    fireEvent.click(screen.getByText("Arrumar a cama"))
    expect(onTaskComplete).not.toHaveBeenCalled()
  })

  it("esconde o botão Resetar quando onResetDay não é fornecido (visão da criança)", () => {
    const { rerender } = render(
      <TaskList tasks={TASKS} completedTasks={[]} onTaskComplete={vi.fn()} />,
    )
    expect(screen.queryByText("Resetar")).not.toBeInTheDocument()

    rerender(
      <TaskList tasks={TASKS} completedTasks={[]} onTaskComplete={vi.fn()} onResetDay={vi.fn()} />,
    )
    expect(screen.getByText("Resetar")).toBeInTheDocument()
  })
})
