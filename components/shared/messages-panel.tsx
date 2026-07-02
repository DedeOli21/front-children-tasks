"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, MessageCircle, Send } from "lucide-react"
import { messagesApi, type ChatMessage, type UserRole } from "@/lib/api"

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  teacher: "Professor(a)",
  therapist: "Terapeuta",
  parent: "Responsável",
}

type Accent = "purple" | "indigo"

const ACCENT_CLASSES: Record<Accent, { active: string; bubble: string; focus: string; button: string }> = {
  purple: {
    active: "border-purple-500 bg-purple-50 text-purple-700",
    bubble: "bg-purple-500 text-white",
    focus: "focus:border-purple-400",
    button: "bg-purple-500",
  },
  indigo: {
    active: "border-indigo-500 bg-indigo-50 text-indigo-700",
    bubble: "bg-indigo-500 text-white",
    focus: "focus:border-indigo-400",
    button: "bg-indigo-500",
  },
}

interface MessagesPanelProps {
  childId: string
  childName: string
  accent?: Accent
}

// Painel de mensagens reutilizado pelos portais de professor e terapeuta:
// lista os contatos vinculados à criança (professor ↔ terapeuta) e a conversa.
export function MessagesPanel({ childId, childName, accent = "purple" }: MessagesPanelProps) {
  const [contacts, setContacts] = useState<{ id: string; name: string; role: UserRole }[]>([])
  const [withUserId, setWithUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const classes = ACCENT_CLASSES[accent]

  useEffect(() => {
    messagesApi
      .contacts(childId)
      .then((list) => {
        setContacts(list)
        setWithUserId(list[0]?.id ?? null)
      })
      .catch(() => setContacts([]))
  }, [childId])

  const loadThread = useCallback(() => {
    if (!withUserId) {
      setMessages([])
      return
    }
    messagesApi.thread(childId, withUserId).then(setMessages).catch(() => setMessages([]))
  }, [childId, withUserId])

  useEffect(() => {
    loadThread()
  }, [loadThread])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!withUserId) return
    setIsSending(true)
    try {
      const sent = await messagesApi.send({ childId, recipientId: withUserId, text })
      setMessages((prev) => [...prev, sent])
      setText("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar")
    } finally {
      setIsSending(false)
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
        <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-2 font-bold text-slate-600">Nenhum contato vinculado a {childName}</p>
        <p className="mt-1 text-sm text-slate-400">
          Quando houver um professor ou terapeuta vinculado à criança, vocês poderão trocar mensagens aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center gap-2 overflow-x-auto">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => setWithUserId(contact.id)}
            className={`shrink-0 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all ${
              withUserId === contact.id ? classes.active : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {contact.name} · {ROLE_LABELS[contact.role] ?? contact.role}
          </button>
        ))}
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Comece a conversa sobre {childName}.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  message.mine ? classes.bubble : "bg-white text-slate-700 shadow"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p className={`mt-1 text-[10px] ${message.mine ? "text-white/70" : "text-slate-400"}`}>
                  {new Date(message.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          placeholder={`Mensagem sobre ${childName}...`}
          className={`flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none ${classes.focus}`}
        />
        <button
          type="submit"
          disabled={isSending}
          className={`flex items-center justify-center rounded-xl px-4 text-white shadow disabled:opacity-50 ${classes.button}`}
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}
