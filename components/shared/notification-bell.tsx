"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Loader2 } from "lucide-react"
import { notificationsApi, type AppNotification } from "@/lib/api"

const TYPE_EMOJI: Record<AppNotification["type"], string> = {
  pet_thirsty: "💧",
  pet_sick: "😢",
  approval_pending: "📥",
  weekly_summary: "📊",
  daily_penalty: "⚠️",
  general: "🔔",
}

// Sino com badge de não-lidas; abrir o painel marca tudo como lido.
// Usado nos headers dos 4 portais.
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshBadge = useCallback(() => {
    notificationsApi
      .unreadCount()
      .then((data) => setUnread(data.unread))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshBadge()
    // Badge atualiza sozinho a cada minuto
    const interval = setInterval(refreshBadge, 60_000)
    return () => clearInterval(interval)
  }, [refreshBadge])

  const handleOpen = async () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    setIsOpen(true)
    setIsLoading(true)
    try {
      const list = await notificationsApi.list()
      setNotifications(list)
      if (unread > 0) {
        await notificationsApi.readAll()
        setUnread(0)
      }
    } catch {
      // painel abre vazio; o badge tenta de novo no próximo ciclo
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center rounded-xl bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Clique fora fecha */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-slate-200">
            <p className="mb-2 px-1 text-xs font-bold uppercase text-slate-400">Notificações</p>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Nada por aqui ainda 🌤️</p>
            ) : (
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl p-2.5 ${notification.readAt ? "bg-white" : "bg-blue-50"}`}
                  >
                    <p className="text-sm font-bold text-slate-700">
                      {TYPE_EMOJI[notification.type]} {notification.title}
                    </p>
                    {notification.body && (
                      <p className="mt-0.5 text-xs text-slate-500">{notification.body}</p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(notification.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
