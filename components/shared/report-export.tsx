"use client"

import { useState } from "react"
import { toast } from "sonner"
import { FileDown, FileText, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { reportsApi } from "@/lib/api"

interface ReportExportProps {
  childId: string
  childName: string
  days?: number
}

// Exportação do relatório compilado (histórico + notas + relatórios escolares)
// em PDF (gerado no cliente) ou CSV (download direto da API).
export function ReportExport({ childId, childName, days = 30 }: ReportExportProps) {
  const [busy, setBusy] = useState<"pdf" | "csv" | null>(null)

  const handleCsv = async () => {
    setBusy("csv")
    try {
      await reportsApi.downloadCsv(childId, childName, days)
      toast.success("CSV baixado!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível gerar o CSV")
    } finally {
      setBusy(null)
    }
  }

  const handlePdf = async () => {
    setBusy("pdf")
    try {
      const report = await reportsApi.compile(childId, days)
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      doc.setFontSize(18)
      doc.text(`Relatório de ${report.child.name}`, pageWidth / 2, 18, { align: "center" })
      doc.setFontSize(11)
      doc.text(
        `Últimos ${report.period.days} dias (desde ${report.period.since})`,
        pageWidth / 2,
        26,
        { align: "center" },
      )

      const t = report.totals
      let y = 38
      doc.setFontSize(12)
      doc.text("Resumo", 14, y)
      y += 7
      doc.setFontSize(10)
      const summary = [
        `Estrelas: ${report.child.currentStars} no saldo · ganhas ${t.starsEarned} · perdidas ${t.starsLost}`,
        `Streak: ${report.child.currentStreak} dia(s) · recorde ${report.child.longestStreak} · proteções usadas ${t.freezesUsed}`,
        `Tarefas aprovadas: ${t.tasksApproved} · Penalidades: ${t.manualPenalties} manuais + ${t.automaticPenalties} automáticas`,
        `Notas dos adultos: ${t.observations} observações · ${t.schoolReports} relatórios escolares`,
      ]
      for (const line of summary) {
        doc.text(line, 14, y)
        y += 6
      }

      autoTable(doc, {
        startY: y + 4,
        head: [["Data", "Categoria", "Autor", "Descrição", "⭐"]],
        body: report.events.map((event) => [
          new Date(event.at).toLocaleDateString("pt-BR"),
          event.category,
          event.author,
          event.description,
          event.starsChange === null ? "" : String(event.starsChange),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [124, 58, 237] },
        columnStyles: { 3: { cellWidth: 80 } },
        margin: { left: 14, right: 14 },
      })

      doc.save(`relatorio-${childName.toLowerCase().replace(/\s+/g, "-")}.pdf`)
      toast.success("PDF gerado!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível gerar o PDF")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePdf}
        disabled={busy !== null}
        className="flex items-center gap-1 rounded-xl bg-violet-500 px-3 py-2 text-sm font-bold text-white shadow transition-transform hover:scale-105 disabled:opacity-50"
      >
        {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        PDF
      </button>
      <button
        onClick={handleCsv}
        disabled={busy !== null}
        className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white shadow transition-transform hover:scale-105 disabled:opacity-50"
      >
        {busy === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        CSV
      </button>
    </div>
  )
}
