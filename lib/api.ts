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

  // Sessão expirada: 401 numa rota autenticada (não confundir com senha
  // errada no login). Limpa o token e recarrega — page.tsx volta ao login.
  const isAuthRoute = endpoint.startsWith("/api/auth/login") || endpoint.startsWith("/api/auth/register")
  if (response.status === 401 && token && !isAuthRoute && typeof window !== "undefined") {
    localStorage.removeItem("token")
    window.location.reload()
    throw new Error("Sessão expirada. Entre novamente.")
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro na requisição" }))
    throw new Error(error.message || "Erro na requisição")
  }

  return response.json()
}

// Anexa ?childId= quando o responsável/professor age sobre uma criança
function withChild(endpoint: string, childId?: string): string {
  if (!childId) return endpoint
  const separator = endpoint.includes("?") ? "&" : "?"
  return `${endpoint}${separator}childId=${encodeURIComponent(childId)}`
}

// ============ AUTENTICAÇÃO ============
export type UserRole = "parent" | "child" | "teacher"

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  parentId?: string | null
  currentStars?: number
  currentStreak?: number
}

export const authApi = {
  register: (data: { name: string; email: string; password: string; role?: "parent" | "teacher" }) =>
    fetchWithAuth("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProfile: (): Promise<UserProfile> => fetchWithAuth("/api/auth/profile"),
}

// ============ CRIANÇAS (visão do responsável) ============
export interface Child {
  id: string
  name: string
  username: string
  inviteCode: string
  currentStars: number
  currentStreak: number
  createdAt: string
}

export interface BehaviorReport {
  id: string
  date: string
  rating: number | null
  text: string
  starsAwarded: number
  teacherName?: string
  createdAt: string
}

export const childrenApi = {
  list: (): Promise<Child[]> => fetchWithAuth("/api/children"),

  create: (data: { name: string; username: string; password: string }): Promise<Child> =>
    fetchWithAuth("/api/children", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; password?: string }): Promise<Child> =>
    fetchWithAuth(`/api/children/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    fetchWithAuth(`/api/children/${id}`, {
      method: "DELETE",
    }),

  reports: (id: string): Promise<BehaviorReport[]> =>
    fetchWithAuth(`/api/children/${id}/reports`),
}

// ============ PROFESSOR ============
export interface Student {
  id: string
  name: string
  currentStars: number
  currentStreak: number
}

export const teacherApi = {
  listStudents: (): Promise<Student[]> => fetchWithAuth("/api/teacher/students"),

  addStudent: (inviteCode: string): Promise<Student> =>
    fetchWithAuth("/api/teacher/students", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    }),

  removeStudent: (childId: string) =>
    fetchWithAuth(`/api/teacher/students/${childId}`, {
      method: "DELETE",
    }),

  giveStars: (childId: string, data: { amount: number; reason: string }) =>
    fetchWithAuth(`/api/teacher/students/${childId}/stars`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createReport: (
    childId: string,
    data: { date?: string; rating?: number; text: string; starsAwarded?: number },
  ): Promise<BehaviorReport & { currentStars: number }> =>
    fetchWithAuth(`/api/teacher/students/${childId}/reports`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listReports: (childId: string): Promise<BehaviorReport[]> =>
    fetchWithAuth(`/api/teacher/students/${childId}/reports`),
}

// ============ ESTRELAS ============
export const starsApi = {
  getBalance: async (childId?: string): Promise<{ stars: number }> => {
    const data = await fetchWithAuth(withChild("/api/stars", childId))
    // API retorna { currentStars }, mapeamos para { stars }
    return { stars: data.currentStars ?? data.stars ?? 0 }
  },

  // Ajustes manuais: apenas responsável, sempre sobre uma criança
  add: (childId: string, amount: number, reason?: string) =>
    fetchWithAuth("/api/stars/add", {
      method: "PATCH",
      body: JSON.stringify({ childId, amount, reason }),
    }),

  subtract: (childId: string, amount: number, reason?: string) =>
    fetchWithAuth("/api/stars/subtract", {
      method: "PATCH",
      body: JSON.stringify({ childId, amount, reason }),
    }),
}

// ============ TAREFAS ============
// Fluxo de aprovação: pending → completed (criança marcou) → approved (responsável liberou as estrelas)
export type TaskStatus = "pending" | "completed" | "approved"

export interface Task {
  id: string
  title: string
  emoji: string
  completed: boolean
  // Sempre presente nas tarefas vindas da API (mapTask); opcional em payloads de criação
  status?: TaskStatus
  completedAt?: string
}

// Interface da API (campos reais retornados)
interface ApiTask {
  id: string
  title: string
  iconEmoji: string
  completedToday: boolean
  status?: TaskStatus
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
    status: apiTask.status ?? (apiTask.completedToday ? "completed" : "pending"),
  }
}

// Execução aguardando aprovação do responsável
export interface PendingTaskApproval {
  logId: string
  taskId: string
  title: string
  iconEmoji: string
  date: string
  childId: string
  childName: string
  completedAt: string | null
}

export const tasksApi = {
  list: async (childId?: string): Promise<Task[]> => {
    const data: ApiTask[] = await fetchWithAuth(withChild("/api/tasks", childId))
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

  complete: (id: string, childId?: string) =>
    fetchWithAuth(withChild(`/api/tasks/${id}/complete`, childId), {
      method: "PATCH",
    }),

  uncomplete: (id: string, childId?: string) =>
    fetchWithAuth(withChild(`/api/tasks/${id}/uncomplete`, childId), {
      method: "PATCH",
    }),

  resetDay: (childId?: string) =>
    fetchWithAuth(withChild("/api/tasks/reset", childId), {
      method: "POST",
    }),

  // Fila "Aguardando Revisão" do responsável
  pendingApproval: (childId?: string): Promise<PendingTaskApproval[]> =>
    fetchWithAuth(withChild("/api/tasks/pending-approval", childId)),

  // Aprova a execução e libera as estrelas
  approveLog: (
    logId: string,
  ): Promise<{ currentStars: number; starsEarned: number; message: string; childId: string }> =>
    fetchWithAuth(`/api/tasks/logs/${logId}/approve`, {
      method: "PATCH",
    }),
}

// ============ MISSÕES (Diário de Bordo) ============
export type MissionStatus = "inbox" | "scheduled" | "completed" | "approved"

export interface Mission {
  id: string
  title: string
  description: string | null
  iconEmoji: string
  status: MissionStatus
  scheduledDate: string | null
  starsReward: number
  childId: string
  childName?: string
  teacherName?: string
  completedAt?: string | null
  approvedAt?: string | null
  createdAt: string
}

export const missionsApi = {
  // Professor: envia missão para um ou mais alunos
  create: (data: {
    childIds: string[]
    title: string
    description?: string
    iconEmoji?: string
    starsReward?: number
  }): Promise<{ id: string; title: string; childId: string; status: MissionStatus }[]> =>
    fetchWithAuth("/api/missions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sent: (): Promise<Mission[]> => fetchWithAuth("/api/missions/sent"),

  // Responsável
  inbox: (): Promise<Mission[]> => fetchWithAuth("/api/missions/inbox"),

  pendingApproval: (): Promise<Mission[]> => fetchWithAuth("/api/missions/pending-approval"),

  allocate: (id: string, date: string): Promise<Mission> =>
    fetchWithAuth(`/api/missions/${id}/allocate`, {
      method: "PATCH",
      body: JSON.stringify({ date }),
    }),

  unschedule: (id: string): Promise<Mission> =>
    fetchWithAuth(`/api/missions/${id}/unschedule`, {
      method: "PATCH",
    }),

  approve: (id: string): Promise<Mission & { currentStars: number; message: string }> =>
    fetchWithAuth(`/api/missions/${id}/approve`, {
      method: "PATCH",
    }),

  // Criança / dia
  forDay: (date?: string, childId?: string): Promise<Mission[]> => {
    const base = date ? `/api/missions/day?date=${date}` : "/api/missions/day"
    return fetchWithAuth(withChild(base, childId))
  },

  complete: (id: string): Promise<Mission & { message: string }> =>
    fetchWithAuth(`/api/missions/${id}/complete`, {
      method: "PATCH",
    }),

  remove: (id: string) =>
    fetchWithAuth(`/api/missions/${id}`, {
      method: "DELETE",
    }),
}

// ============ TEMPLATES DE ROTINA ============
export interface TemplateTask {
  id?: string
  title: string
  iconEmoji?: string
  scheduledTime?: string | null
  timeOfDay?: string | null
  sortOrder?: number
}

export interface RoutineTemplate {
  id: string
  name: string
  emoji: string
  description: string | null
  tasks: TemplateTask[]
}

export const templatesApi = {
  list: (): Promise<RoutineTemplate[]> => fetchWithAuth("/api/routine-templates"),

  create: (data: {
    name: string
    emoji?: string
    description?: string
    tasks: TemplateTask[]
  }): Promise<RoutineTemplate> =>
    fetchWithAuth("/api/routine-templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ name: string; emoji: string; description: string; tasks: TemplateTask[] }>): Promise<RoutineTemplate> =>
    fetchWithAuth(`/api/routine-templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    fetchWithAuth(`/api/routine-templates/${id}`, {
      method: "DELETE",
    }),

  // Materializa o template no dia da criança
  instantiate: (
    id: string,
    childId: string,
    date?: string,
  ): Promise<{ scheduled: number; tasksCreated: number; message: string }> =>
    fetchWithAuth(`/api/routine-templates/${id}/instantiate`, {
      method: "POST",
      body: JSON.stringify({ childId, date }),
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

  apply: (penaltyId: string, childId: string) =>
    fetchWithAuth("/api/penalties/apply", {
      method: "POST",
      body: JSON.stringify({ penaltyId, childId }),
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

  redeem: (id: string, childId?: string) =>
    fetchWithAuth(withChild(`/api/rewards/${id}/redeem`, childId), {
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
  list: (childId?: string): Promise<HistoryEntry[]> =>
    fetchWithAuth(withChild("/api/history", childId)),

  getByRange: (startDate: string, endDate: string, childId?: string): Promise<HistoryEntry[]> =>
    fetchWithAuth(withChild(`/api/history/range?startDate=${startDate}&endDate=${endDate}`, childId)),

  getStatistics: (childId?: string) =>
    fetchWithAuth(withChild("/api/history/statistics", childId)),
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
  list: async (childId?: string): Promise<RoutineItem[]> => {
    const data: ApiRoutine[] = await fetchWithAuth(withChild("/api/routines", childId))
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

  complete: (id: string, childId?: string) =>
    fetchWithAuth(withChild(`/api/routines/${id}/complete`, childId), {
      method: "PATCH",
    }),

  uncomplete: (id: string, childId?: string) =>
    fetchWithAuth(withChild(`/api/routines/${id}/uncomplete`, childId), {
      method: "PATCH",
    }),

  getTodayProgress: (childId?: string): Promise<{ total: number; completed: number; completedIds: string[] }> =>
    fetchWithAuth(withChild("/api/routines/progress/today", childId)),
}

// ============ STREAKS ============
export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string | null
}

export const streaksApi = {
  get: (childId?: string): Promise<StreakData> =>
    fetchWithAuth(withChild("/api/streaks", childId)),
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

  open: (childId?: string): Promise<{ prize: MysteryPrize; newBalance: number }> =>
    fetchWithAuth(withChild("/api/mystery-box/open", childId), {
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
