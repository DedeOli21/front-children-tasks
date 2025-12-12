"use client"

import { useState, useEffect, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Download, Calendar, TrendingUp, AlertTriangle, CheckCircle, Gift } from "lucide-react"
import { historyApi, type HistoryEntry } from "@/lib/api"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type PeriodType = "day" | "week" | "month"

export function HistoryReport() {
  const [period, setPeriod] = useState<PeriodType>("day")
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [period])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      let startDate: Date = startOfDay(now)
      let endDate: Date = endOfDay(now)

      switch (period) {
        case "day":
          startDate = startOfDay(now)
          endDate = endOfDay(now)
          break
        case "week":
          startDate = startOfWeek(now, { locale: ptBR })
          endDate = endOfWeek(now, { locale: ptBR })
          break
        case "month":
          startDate = startOfMonth(now)
          endDate = endOfMonth(now)
          break
      }

      const data = await historyApi.getByRange(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      )
      setHistory(data)
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Processar dados para gráficos
  const chartData = useMemo(() => {
    const tasksByDay: Record<string, number> = {}
    const penaltiesByDay: Record<string, number> = {}
    const rewardsByDay: Record<string, number> = {}

    history.forEach((entry) => {
      const date = format(new Date(entry.createdAt), "dd/MM")
      
      if (entry.type === "task_complete") {
        tasksByDay[date] = (tasksByDay[date] || 0) + 1
      } else if (entry.type === "penalty") {
        penaltiesByDay[date] = (penaltiesByDay[date] || 0) + 1
      } else if (entry.type === "reward_redeem") {
        rewardsByDay[date] = (rewardsByDay[date] || 0) + 1
      }
    })

    const allDates = new Set([...Object.keys(tasksByDay), ...Object.keys(penaltiesByDay), ...Object.keys(rewardsByDay)])
    
    return Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        Tarefas: tasksByDay[date] || 0,
        Penalidades: penaltiesByDay[date] || 0,
        Recompensas: rewardsByDay[date] || 0,
      }))
  }, [history])

  // Dados para gráfico de pizza
  const pieData = useMemo(() => {
    const tasks = history.filter((e) => e.type === "task_complete").length
    const penalties = history.filter((e) => e.type === "penalty").length
    const rewards = history.filter((e) => e.type === "reward_redeem").length

    return [
      { name: "Tarefas Completas", value: tasks, color: "#10b981" },
      { name: "Penalidades", value: penalties, color: "#ef4444" },
      { name: "Recompensas", value: rewards, color: "#f59e0b" },
    ].filter((item) => item.value > 0)
  }, [history])

  // Estatísticas
  const stats = useMemo(() => {
    const tasksCompleted = history.filter((e) => e.type === "task_complete").length
    const penaltiesApplied = history.filter((e) => e.type === "penalty").length
    const rewardsRedeemed = history.filter((e) => e.type === "reward_redeem").length
    const starsEarned = history
      .filter((e) => e.starsChange > 0)
      .reduce((sum, e) => sum + e.starsChange, 0)
    const starsSpent = Math.abs(
      history
        .filter((e) => e.starsChange < 0)
        .reduce((sum, e) => sum + e.starsChange, 0)
    )

    return {
      tasksCompleted,
      penaltiesApplied,
      rewardsRedeemed,
      starsEarned,
      starsSpent,
    }
  }, [history])

  const exportToPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Título
    doc.setFontSize(20)
    doc.text("Relatório de Histórico", pageWidth / 2, 20, { align: "center" })

    // Período
    doc.setFontSize(12)
    const periodText = period === "day" ? "Hoje" : period === "week" ? "Esta Semana" : "Este Mês"
    doc.text(`Período: ${periodText}`, pageWidth / 2, 30, { align: "center" })
    doc.text(`Data: ${format(new Date(), "dd/MM/yyyy")}`, pageWidth / 2, 37, { align: "center" })

    // Estatísticas
    let yPos = 50
    doc.setFontSize(14)
    doc.text("Estatísticas", 14, yPos)
    yPos += 10

    doc.setFontSize(11)
    doc.text(`Tarefas Completas: ${stats.tasksCompleted}`, 14, yPos)
    yPos += 7
    doc.text(`Penalidades Aplicadas: ${stats.penaltiesApplied}`, 14, yPos)
    yPos += 7
    doc.text(`Recompensas Resgatadas: ${stats.rewardsRedeemed}`, 14, yPos)
    yPos += 7
    doc.text(`Estrelas Ganhas: ${stats.starsEarned}`, 14, yPos)
    yPos += 7
    doc.text(`Estrelas Gastas: ${stats.starsSpent}`, 14, yPos)
    yPos += 10

    // Tabela de histórico
    if (history.length > 0) {
      doc.setFontSize(14)
      doc.text("Histórico Detalhado", 14, yPos)
      yPos += 10

      const tableData = history.map((entry) => {
        const typeLabel =
          entry.type === "task_complete"
            ? "Tarefa"
            : entry.type === "penalty"
              ? "Penalidade"
              : "Recompensa"
        return [
          format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm"),
          typeLabel,
          entry.description,
          entry.starsChange > 0 ? `+${entry.starsChange}` : `${entry.starsChange}`,
        ]
      })

      autoTable(doc, {
        startY: yPos,
        head: [["Data/Hora", "Tipo", "Descrição", "Estrelas"]],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      })
    }

    // Salvar PDF
    const fileName = `historico-${period}-${format(new Date(), "yyyy-MM-dd")}.pdf`
    doc.save(fileName)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-lg">
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("day")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-all ${
              period === "day"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Dia
          </button>
          <button
            onClick={() => setPeriod("week")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-all ${
              period === "week"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Semana
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-all ${
              period === "month"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Mês
          </button>
        </div>

        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 font-bold text-white shadow-md transition-all hover:bg-green-600"
        >
          <Download className="h-4 w-4" />
          Exportar PDF
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-2xl bg-green-50 p-4 shadow-md">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-semibold text-slate-600">Tarefas</span>
          </div>
          <p className="text-2xl font-black text-green-600">{stats.tasksCompleted}</p>
        </div>

        <div className="rounded-2xl bg-red-50 p-4 shadow-md">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-semibold text-slate-600">Penalidades</span>
          </div>
          <p className="text-2xl font-black text-red-600">{stats.penaltiesApplied}</p>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4 shadow-md">
          <div className="mb-2 flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-semibold text-slate-600">Recompensas</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.rewardsRedeemed}</p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4 shadow-md">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-600">Estrelas +</span>
          </div>
          <p className="text-2xl font-black text-blue-600">{stats.starsEarned}</p>
        </div>

        <div className="rounded-2xl bg-purple-50 p-4 shadow-md">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600 rotate-180" />
            <span className="text-sm font-semibold text-slate-600">Estrelas -</span>
          </div>
          <p className="text-2xl font-black text-purple-600">{stats.starsSpent}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Barras */}
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-black text-slate-700">Atividades por Dia</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tarefas" fill="#10b981" />
                <Bar dataKey="Penalidades" fill="#ef4444" />
                <Bar dataKey="Recompensas" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-slate-400">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </div>

        {/* Gráfico de Pizza */}
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-black text-slate-700">Distribuição de Atividades</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-slate-400">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </div>
      </div>

      {/* Lista de Histórico */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-black text-slate-700">Histórico Detalhado</h3>
        {history.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((entry) => {
              const isPositive = entry.starsChange > 0
              const typeIcon =
                entry.type === "task_complete" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : entry.type === "penalty" ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <Gift className="h-4 w-4 text-amber-600" />
                )

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    {typeIcon}
                    <div>
                      <p className="font-semibold text-slate-700">{entry.description}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(entry.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 font-bold ${
                      isPositive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {entry.starsChange} ⭐
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            Nenhum histórico disponível para o período selecionado
          </div>
        )}
      </div>
    </div>
  )
}

