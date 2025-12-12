// Detecta automaticamente o hostname correto para a API
// Prioriza a variável de ambiente NEXT_PUBLIC_API_URL
// Se estiver acessando pelo IP (ex: 172.18.224.1), usa o mesmo IP para a API
// Se estiver em localhost, usa localhost
function getApiBaseUrl(): string {
  // Prioriza a variável de ambiente (usada em produção)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  if (typeof window === "undefined") {
    // Server-side: usa localhost como fallback
    return "http://localhost:3001"
  }
  
  // Client-side: detecta automaticamente
  const hostname = window.location.hostname
  const port = "3001"
  
  // Se for localhost ou 127.0.0.1, usa localhost
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://localhost:${port}`
  }
  
  // Em produção (Vercel, etc), se não tiver variável de ambiente, tenta usar HTTPS
  // Mas é melhor sempre configurar NEXT_PUBLIC_API_URL
  const protocol = window.location.protocol === "https:" ? "https" : "http"
  return `${protocol}://${hostname}:${port}`
}

const API_BASE_URL = getApiBaseUrl()

// Helper para fazer requisições autenticadas
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro na requisição" }))
    throw new Error(error.message || "Erro na requisição")
  }

  return response.json()
}

// ============ AUTENTICAÇÃO ============
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    fetchWithAuth("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProfile: () => fetchWithAuth("/api/auth/profile"),
}

// ============ ESTRELAS ============
export const starsApi = {
  getBalance: async (): Promise<{ stars: number }> => {
    const data = await fetchWithAuth("/api/stars")
    // API retorna { currentStars }, mapeamos para { stars }
    return { stars: data.currentStars ?? data.stars ?? 0 }
  },

  add: (amount: number) =>
    fetchWithAuth("/api/stars/add", {
      method: "PATCH",
      body: JSON.stringify({ amount }),
    }),

  subtract: (amount: number) =>
    fetchWithAuth("/api/stars/subtract", {
      method: "PATCH",
      body: JSON.stringify({ amount }),
    }),
}

// ============ TAREFAS ============
export interface Task {
  id: string
  title: string
  emoji: string
  completed: boolean
  completedAt?: string
}

// Interface da API (campos reais retornados)
interface ApiTask {
  id: string
  title: string
  iconEmoji: string
  completedToday: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

// Mapeia tarefa da API para o formato do frontend
function mapTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    emoji: apiTask.iconEmoji,
    completed: apiTask.completedToday,
  }
}

export const tasksApi = {
  list: async (): Promise<Task[]> => {
    const data: ApiTask[] = await fetchWithAuth("/api/tasks")
    return data.map(mapTask)
  },

  create: async (data: { title: string; emoji: string }): Promise<Task> => {
    // API espera iconEmoji
    const apiData = { title: data.title, iconEmoji: data.emoji }
    const result = await fetchWithAuth("/api/tasks", {
      method: "POST",
      body: JSON.stringify(apiData),
    })
    return mapTask(result)
  },

  update: async (id: string, data: Partial<Task>): Promise<Task> => {
    // Mapeia emoji para iconEmoji se presente
    const apiData: Record<string, unknown> = { ...data }
    if (data.emoji) {
      apiData.iconEmoji = data.emoji
      delete apiData.emoji
    }
    const result = await fetchWithAuth(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(apiData),
    })
    return mapTask(result)
  },

  delete: (id: string) =>
    fetchWithAuth(`/api/tasks/${id}`, {
      method: "DELETE",
    }),

  complete: (id: string) =>
    fetchWithAuth(`/api/tasks/${id}/complete`, {
      method: "PATCH",
    }),

  uncomplete: (id: string) =>
    fetchWithAuth(`/api/tasks/${id}/uncomplete`, {
      method: "PATCH",
    }),

  resetDay: () =>
    fetchWithAuth("/api/tasks/reset", {
      method: "POST",
    }),
}

// ============ PENALIDADES ============
export interface Penalty {
  id: string
  title: string
  emoji: string
  amount: number
}

export const penaltiesApi = {
  list: (): Promise<Penalty[]> => fetchWithAuth("/api/penalties"),

  create: (data: { title: string; emoji: string; amount: number }) =>
    fetchWithAuth("/api/penalties", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Penalty>) =>
    fetchWithAuth(`/api/penalties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth(`/api/penalties/${id}`, {
      method: "DELETE",
    }),

  apply: (penaltyId: string) =>
    fetchWithAuth("/api/penalties/apply", {
      method: "POST",
      body: JSON.stringify({ penaltyId }),
    }),
}

// ============ RECOMPENSAS ============
export interface Reward {
  id: string
  title: string
  emoji: string
  description?: string
  cost: number
}

export const rewardsApi = {
  list: (): Promise<Reward[]> => fetchWithAuth("/api/rewards"),

  create: (data: { title: string; emoji: string; description?: string; cost: number }) =>
    fetchWithAuth("/api/rewards", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Reward>) =>
    fetchWithAuth(`/api/rewards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth(`/api/rewards/${id}`, {
      method: "DELETE",
    }),

  redeem: (id: string) =>
    fetchWithAuth(`/api/rewards/${id}/redeem`, {
      method: "POST",
    }),
}

// ============ HISTÓRICO ============
export interface HistoryEntry {
  id: string
  type: "task_complete" | "penalty" | "reward_redeem"
  description: string
  starsChange: number
  createdAt: string
}

export const historyApi = {
  list: (): Promise<HistoryEntry[]> => fetchWithAuth("/api/history"),

  getByRange: (startDate: string, endDate: string) =>
    fetchWithAuth(`/api/history/range?startDate=${startDate}&endDate=${endDate}`),

  getStatistics: () => fetchWithAuth("/api/history/statistics"),
}

// ============ ROTINAS ============
export interface RoutineItem {
  id: string
  time: string
  title: string
  emoji: string
  period: "morning" | "evening"
  completedToday?: boolean
}

// Interface da API (campos reais retornados)
interface ApiRoutine {
  id: string
  name: string
  emoji: string
  timeOfDay: "morning" | "afternoon" | "night"
  scheduledTime: string | null
  active: boolean
  sortOrder: number
  completedToday?: boolean
}

// Mapeia rotina da API para o formato do frontend
function mapRoutine(apiRoutine: ApiRoutine): RoutineItem {
  // Mapeia timeOfDay para period (afternoon e night viram evening)
  const period: "morning" | "evening" = apiRoutine.timeOfDay === "morning" ? "morning" : "evening"
  
  return {
    id: apiRoutine.id,
    title: apiRoutine.name,
    emoji: apiRoutine.emoji,
    time: apiRoutine.scheduledTime || "",
    period,
    completedToday: apiRoutine.completedToday || false,
  }
}

export const routinesApi = {
  list: async (): Promise<RoutineItem[]> => {
    const data: ApiRoutine[] = await fetchWithAuth("/api/routines")
    return data.map(mapRoutine)
  },

  create: async (data: { time: string; title: string; emoji: string; period: "morning" | "evening" }): Promise<RoutineItem> => {
    // Mapeia para o formato da API
    const apiData = {
      name: data.title,
      emoji: data.emoji,
      scheduledTime: data.time,
      timeOfDay: data.period === "morning" ? "morning" : "night",
    }
    const result = await fetchWithAuth("/api/routines", {
      method: "POST",
      body: JSON.stringify(apiData),
    })
    return mapRoutine(result)
  },

  update: async (id: string, data: Partial<RoutineItem>): Promise<RoutineItem> => {
    // Mapeia para o formato da API
    const apiData: Record<string, unknown> = {}
    if (data.title) apiData.name = data.title
    if (data.emoji) apiData.emoji = data.emoji
    if (data.time) apiData.scheduledTime = data.time
    if (data.period) apiData.timeOfDay = data.period === "morning" ? "morning" : "night"
    
    const result = await fetchWithAuth(`/api/routines/${id}`, {
      method: "PATCH",
      body: JSON.stringify(apiData),
    })
    return mapRoutine(result)
  },

  delete: (id: string) =>
    fetchWithAuth(`/api/routines/${id}`, {
      method: "DELETE",
    }),

  complete: (id: string) =>
    fetchWithAuth(`/api/routines/${id}/complete`, {
      method: "PATCH",
    }),

  uncomplete: (id: string) =>
    fetchWithAuth(`/api/routines/${id}/uncomplete`, {
      method: "PATCH",
    }),

  getTodayProgress: (): Promise<{ total: number; completed: number; completedIds: string[] }> =>
    fetchWithAuth("/api/routines/progress/today"),
}

// ============ STREAKS ============
export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string | null
}

export const streaksApi = {
  get: (): Promise<StreakData> => fetchWithAuth("/api/streaks"),

  update: () =>
    fetchWithAuth("/api/streaks/update", {
      method: "POST",
    }),
}

// ============ AVATAR ============
export interface AvatarItem {
  id: string
  name: string
  emoji: string
  type: "hat" | "accessory" | "background" | "outfit"
  cost: number
  owned: boolean
  equipped: boolean
}

export const avatarApi = {
  getItems: (): Promise<AvatarItem[]> => fetchWithAuth("/api/avatar/items"),

  purchase: (itemId: string) =>
    fetchWithAuth(`/api/avatar/items/${itemId}/purchase`, {
      method: "POST",
    }),

  equip: (itemId: string) =>
    fetchWithAuth(`/api/avatar/items/${itemId}/equip`, {
      method: "POST",
    }),

  unequip: (itemId: string) =>
    fetchWithAuth(`/api/avatar/items/${itemId}/unequip`, {
      method: "POST",
    }),
}

// ============ MYSTERY BOX ============
export interface MysteryPrize {
  id: string
  name: string
  emoji: string
  rarity: "common" | "rare" | "epic" | "legendary"
  description: string
  weight?: number
}

export interface MysteryBoxConfig {
  cost: number
  prizes: MysteryPrize[]
}

export const mysteryBoxApi = {
  getConfig: (): Promise<MysteryBoxConfig> => fetchWithAuth("/api/mystery-box"),

  open: (): Promise<{ prize: MysteryPrize; newBalance: number }> =>
    fetchWithAuth("/api/mystery-box/open", {
      method: "POST",
    }),

  listPrizes: (): Promise<MysteryPrize[]> => fetchWithAuth("/api/mystery-box/prizes"),

  createPrize: (data: { name: string; emoji: string; rarity: MysteryPrize["rarity"]; description: string; weight?: number }) =>
    fetchWithAuth("/api/mystery-box/prizes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePrize: (id: string, data: Partial<MysteryPrize>) =>
    fetchWithAuth(`/api/mystery-box/prizes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deletePrize: (id: string) =>
    fetchWithAuth(`/api/mystery-box/prizes/${id}`, {
      method: "DELETE",
    }),
}
