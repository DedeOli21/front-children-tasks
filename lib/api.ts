// Detecta automaticamente o hostname correto para a API
// Prioriza a variável de ambiente NEXT_PUBLIC_API_URL
// Se estiver acessando pelo IP (ex: 172.18.224.1), usa o mesmo IP para a API
// Se estiver em localhost, usa localhost
function getApiBaseUrl(): string {
  // Prioriza a variável de ambiente (usada em produção)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window === "undefined") {
    // Server-side: usa localhost como fallback
    return "http://localhost:3001";
  }

  // Client-side: detecta automaticamente
  const hostname = window.location.hostname;
  const port = "3001";

  // Se for localhost ou 127.0.0.1, usa localhost
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://localhost:${port}`;
  }

  // Em produção (Vercel, etc), se não tiver variável de ambiente, tenta usar HTTPS
  // Mas é melhor sempre configurar NEXT_PUBLIC_API_URL
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${hostname}:${port}`;
}

const API_BASE_URL = getApiBaseUrl();

// Helper para fazer requisições autenticadas
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Sessão expirada: 401 numa rota autenticada (não confundir com senha
  // errada no login). Limpa o token e recarrega — page.tsx volta ao login.
  const isAuthRoute =
    endpoint.startsWith("/api/auth/login") ||
    endpoint.startsWith("/api/auth/register");
  if (
    response.status === 401 &&
    token &&
    !isAuthRoute &&
    typeof window !== "undefined"
  ) {
    localStorage.removeItem("token");
    window.location.reload();
    throw new Error("Sessão expirada. Entre novamente.");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Erro na requisição" }));
    throw new Error(error.message || "Erro na requisição");
  }

  return response.json();
}

// Anexa ?childId= quando o responsável/professor age sobre uma criança
function withChild(endpoint: string, childId?: string): string {
  if (!childId) return endpoint;
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}childId=${encodeURIComponent(childId)}`;
}

// ============ AUTENTICAÇÃO ============
export type UserRole = "parent" | "child" | "teacher" | "therapist";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  parentId?: string | null;
  currentStars?: number;
  currentStreak?: number;
}

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: "parent" | "teacher";
  }) =>
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
};

// ============ CRIANÇAS (visão do responsável) ============
export interface Child {
  id: string;
  name: string;
  username: string;
  inviteCode: string;
  currentStars: number;
  currentStreak: number;
  createdAt: string;
}

export interface BehaviorReport {
  id: string;
  date: string;
  rating: number | null;
  text: string;
  starsAwarded: number;
  teacherName?: string;
  createdAt: string;
}

export const childrenApi = {
  list: (): Promise<Child[]> => fetchWithAuth("/api/children"),

  create: (data: {
    name: string;
    username: string;
    password: string;
  }): Promise<Child> =>
    fetchWithAuth("/api/children", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: { name?: string; password?: string },
  ): Promise<Child> =>
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
};

// ============ PROFESSOR ============
export interface Student {
  id: string;
  name: string;
  currentStars: number;
  currentStreak: number;
}

export const teacherApi = {
  listStudents: (): Promise<Student[]> =>
    fetchWithAuth("/api/teacher/students"),

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
    data: {
      date?: string;
      rating?: number;
      text: string;
      starsAwarded?: number;
    },
  ): Promise<BehaviorReport & { currentStars: number }> =>
    fetchWithAuth(`/api/teacher/students/${childId}/reports`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listReports: (childId: string): Promise<BehaviorReport[]> =>
    fetchWithAuth(`/api/teacher/students/${childId}/reports`),
};

// ============ ESTRELAS ============
// Bonificação sugerida pela terapeuta, pendente de aprovação do responsável
export interface StarRequest {
  id: string;
  childId: string;
  childName?: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  therapistName?: string;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface StarApprovalResult extends StarRequest {
  currentStars: number;
  baseAmount?: number;
  starsEarned?: number;
  eventMultiplier?: number;
  message: string;
}

export const starsApi = {
  getBalance: async (childId?: string): Promise<{ stars: number }> => {
    const data = await fetchWithAuth(withChild("/api/stars", childId));
    // API retorna { currentStars }, mapeamos para { stars }
    return { stars: data.currentStars ?? data.stars ?? 0 };
  },

  // Terapeuta sugere estrelas (motivo obrigatório)
  suggest: (data: {
    childId: string;
    amount: number;
    reason: string;
  }): Promise<StarRequest & { message: string }> =>
    fetchWithAuth("/api/stars/suggest", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Responsável: caixa de aprovação · Criança: as próprias pendentes
  listRequests: (status?: StarRequest["status"]): Promise<StarRequest[]> =>
    fetchWithAuth(
      status ? `/api/stars/requests?status=${status}` : "/api/stars/requests",
    ),

  // Sugestões enviadas pela terapeuta
  listMyRequests: (): Promise<StarRequest[]> =>
    fetchWithAuth("/api/stars/requests/mine"),

  approveRequest: (id: string): Promise<StarApprovalResult> =>
    fetchWithAuth(`/api/stars/approve/${id}`, { method: "PATCH" }),

  rejectRequest: (id: string): Promise<StarRequest & { message: string }> =>
    fetchWithAuth(`/api/stars/reject/${id}`, { method: "PATCH" }),

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
};

// ============ SUPER INICIATIVA ============
export type ProactiveCategoryIcon = "studies" | "organization";
export type ProactiveRequestStatus =
  "pending" | "approved" | "adjusted" | "rejected";

export interface ProactiveRequest {
  id: string;
  familyId: string;
  childId: string;
  childName?: string;
  categoryIcon: ProactiveCategoryIcon;
  categoryEmoji?: string;
  description: string;
  suggestedStars: number;
  finalStars: number | null;
  status: ProactiveRequestStatus;
  reviewedById?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProactiveApprovalResult extends ProactiveRequest {
  currentStars: number;
  starsEarned: number;
  message: string;
}

export const proactiveRequestsApi = {
  create: (data: {
    categoryIcon: ProactiveCategoryIcon;
    description: string;
    suggestedStars: number;
  }): Promise<ProactiveRequest & { message: string }> =>
    fetchWithAuth("/api/proactive-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: (
    status?: ProactiveRequestStatus,
    childId?: string,
  ): Promise<ProactiveRequest[]> => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (childId) params.set("childId", childId);
    const query = params.toString();
    return fetchWithAuth(`/api/proactive-requests${query ? `?${query}` : ""}`);
  },

  pending: (childId?: string): Promise<ProactiveRequest[]> =>
    fetchWithAuth(withChild("/api/proactive-requests/pending", childId)),

  approve: (
    id: string,
    finalStars?: number,
  ): Promise<ProactiveApprovalResult> =>
    fetchWithAuth(`/api/proactive-requests/${id}/approve`, {
      method: "PATCH",
      ...(finalStars === undefined
        ? {}
        : { body: JSON.stringify({ finalStars }) }),
    }),

  reject: (id: string): Promise<ProactiveRequest & { message: string }> =>
    fetchWithAuth(`/api/proactive-requests/${id}/reject`, {
      method: "PATCH",
    }),
};

// ============ TAREFAS ============
// Fluxo de aprovação: pending → completed (criança marcou) → approved (responsável liberou as estrelas)
export type TaskStatus = "pending" | "completed" | "approved";

export interface Task {
  id: string;
  title: string;
  emoji: string;
  completed: boolean;
  source?: "classic" | "active";
  // Presente apenas quando source === "active": id do TaskTemplate que originou a instância do dia
  templateId?: string;
  // Sempre presente nas tarefas vindas da API (mapTask); opcional em payloads de criação
  status?: TaskStatus;
  completedAt?: string;
}

// Interface da API (campos reais retornados)
interface ApiTask {
  id: string;
  title: string;
  iconEmoji: string;
  completedToday: boolean;
  status?: TaskStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mapeia tarefa da API para o formato do frontend
function mapTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    emoji: apiTask.iconEmoji,
    completed: apiTask.completedToday,
    status:
      apiTask.status ?? (apiTask.completedToday ? "completed" : "pending"),
  };
}

// Execução aguardando aprovação do responsável
export interface PendingTaskApproval {
  logId: string;
  taskId: string;
  title: string;
  iconEmoji: string;
  date: string;
  childId: string;
  childName: string;
  completedAt: string | null;
}

export const tasksApi = {
  list: async (childId?: string): Promise<Task[]> => {
    const data: ApiTask[] = await fetchWithAuth(
      withChild("/api/tasks", childId),
    );
    return data.map(mapTask);
  },

  create: async (data: { title: string; emoji: string }): Promise<Task> => {
    // API espera iconEmoji
    const apiData = { title: data.title, iconEmoji: data.emoji };
    const result = await fetchWithAuth("/api/tasks", {
      method: "POST",
      body: JSON.stringify(apiData),
    });
    return mapTask(result);
  },

  update: async (id: string, data: Partial<Task>): Promise<Task> => {
    // Mapeia emoji para iconEmoji se presente
    const apiData: Record<string, unknown> = { ...data };
    if (data.emoji) {
      apiData.iconEmoji = data.emoji;
      delete apiData.emoji;
    }
    const result = await fetchWithAuth(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(apiData),
    });
    return mapTask(result);
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
  ): Promise<{
    currentStars: number;
    starsEarned: number;
    message: string;
    childId: string;
  }> =>
    fetchWithAuth(`/api/tasks/logs/${logId}/approve`, {
      method: "PATCH",
    }),
};

// ============ TAREFAS V2 ============
export type TaskType = "fixed" | "extra";
export type RecurrenceDay =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface TaskTemplate {
  id: string;
  familyId: string;
  childId: string;
  title: string;
  emoji: string;
  rewardStars: number;
  taskType: TaskType;
  recurrenceDays: RecurrenceDay[];
  scheduledDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveTask {
  id: string;
  templateId: string;
  familyId: string;
  childId: string;
  childName?: string;
  date: string;
  title: string;
  emoji: string;
  rewardStars: number;
  status: TaskStatus;
  completedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export const taskTemplatesApi = {
  list: (childId?: string): Promise<TaskTemplate[]> =>
    fetchWithAuth(withChild("/api/task-templates", childId)),

  create: (data: {
    childId: string;
    title: string;
    emoji?: string;
    rewardStars?: number;
    taskType?: TaskType;
    recurrenceDays?: RecurrenceDay[];
    scheduledDate?: string;
  }): Promise<TaskTemplate> =>
    fetchWithAuth("/api/task-templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<
      Omit<
        TaskTemplate,
        "id" | "familyId" | "childId" | "createdAt" | "updatedAt"
      >
    >,
  ) =>
    fetchWithAuth(`/api/task-templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    fetchWithAuth(`/api/task-templates/${id}`, {
      method: "DELETE",
    }),
};

export const activeTasksApi = {
  forDay: (date?: string, childId?: string): Promise<ActiveTask[]> => {
    const base = date
      ? `/api/active-tasks/day?date=${date}`
      : "/api/active-tasks/day";
    return fetchWithAuth(withChild(base, childId));
  },

  pendingApproval: (childId?: string): Promise<ActiveTask[]> =>
    fetchWithAuth(withChild("/api/active-tasks/pending-approval", childId)),

  complete: (id: string): Promise<ActiveTask & { message: string }> =>
    fetchWithAuth(`/api/active-tasks/${id}/complete`, {
      method: "PATCH",
    }),

  uncomplete: (id: string): Promise<ActiveTask> =>
    fetchWithAuth(`/api/active-tasks/${id}/uncomplete`, {
      method: "PATCH",
    }),

  approve: (
    id: string,
  ): Promise<
    ActiveTask & {
      currentStars: number;
      starsEarned: number;
      eventMultiplier: number;
      message: string;
    }
  > =>
    fetchWithAuth(`/api/active-tasks/${id}/approve`, {
      method: "PATCH",
    }),
};

// ============ MISSÕES (Diário de Bordo) ============
export type MissionStatus = "inbox" | "scheduled" | "completed" | "approved";

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  iconEmoji: string;
  status: MissionStatus;
  scheduledDate: string | null;
  starsReward: number;
  childId: string;
  childName?: string;
  teacherName?: string;
  completedAt?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

export const missionsApi = {
  // Professor: envia missão para um ou mais alunos
  create: (data: {
    childIds: string[];
    title: string;
    description?: string;
    iconEmoji?: string;
    starsReward?: number;
  }): Promise<
    { id: string; title: string; childId: string; status: MissionStatus }[]
  > =>
    fetchWithAuth("/api/missions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sent: (): Promise<Mission[]> => fetchWithAuth("/api/missions/sent"),

  // Responsável
  inbox: (): Promise<Mission[]> => fetchWithAuth("/api/missions/inbox"),

  pendingApproval: (): Promise<Mission[]> =>
    fetchWithAuth("/api/missions/pending-approval"),

  allocate: (id: string, date: string): Promise<Mission> =>
    fetchWithAuth(`/api/missions/${id}/allocate`, {
      method: "PATCH",
      body: JSON.stringify({ date }),
    }),

  unschedule: (id: string): Promise<Mission> =>
    fetchWithAuth(`/api/missions/${id}/unschedule`, {
      method: "PATCH",
    }),

  approve: (
    id: string,
  ): Promise<Mission & { currentStars: number; message: string }> =>
    fetchWithAuth(`/api/missions/${id}/approve`, {
      method: "PATCH",
    }),

  // Criança / dia
  forDay: (date?: string, childId?: string): Promise<Mission[]> => {
    const base = date ? `/api/missions/day?date=${date}` : "/api/missions/day";
    return fetchWithAuth(withChild(base, childId));
  },

  complete: (id: string): Promise<Mission & { message: string }> =>
    fetchWithAuth(`/api/missions/${id}/complete`, {
      method: "PATCH",
    }),

  remove: (id: string) =>
    fetchWithAuth(`/api/missions/${id}`, {
      method: "DELETE",
    }),
};

// ============ TEMPLATES DE ROTINA ============
export interface TemplateTask {
  id?: string;
  title: string;
  iconEmoji?: string;
  scheduledTime?: string | null;
  timeOfDay?: string | null;
  sortOrder?: number;
}

export interface RoutineTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  tasks: TemplateTask[];
}

export const templatesApi = {
  list: (): Promise<RoutineTemplate[]> =>
    fetchWithAuth("/api/routine-templates"),

  create: (data: {
    name: string;
    emoji?: string;
    description?: string;
    tasks: TemplateTask[];
  }): Promise<RoutineTemplate> =>
    fetchWithAuth("/api/routine-templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<{
      name: string;
      emoji: string;
      description: string;
      tasks: TemplateTask[];
    }>,
  ): Promise<RoutineTemplate> =>
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
};

// ============ PENALIDADES ============
export interface Penalty {
  id: string;
  title: string;
  emoji: string;
  amount: number;
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
};

// ============ RECOMPENSAS ============
export interface Reward {
  id: string;
  title: string;
  emoji: string;
  description?: string | null;
  cost: number;
  kind?: "privilege" | "streak_freeze";
}

export const rewardsApi = {
  list: (): Promise<Reward[]> => fetchWithAuth("/api/rewards"),

  create: (data: {
    title: string;
    emoji: string;
    description?: string | null;
    cost: number;
    kind?: Reward["kind"];
  }) =>
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
};

// ============ HISTÓRICO ============
export interface HistoryEntry {
  id: string;
  type:
    | "task_complete"
    | "penalty"
    | "reward_redeem"
    | "streak_freeze_used"
    | "stars_add"
    | "stars_subtract";
  description: string;
  starsChange: number;
  createdAt: string;
}

// ============ COFRINHO COMPARTILHADO ============
export type FamilyGoalStatus = "active" | "completed" | "cancelled";

export interface FamilyGoal {
  id: string;
  familyId: string;
  title: string;
  emoji: string;
  description: string | null;
  targetStars: number;
  depositedStars: number;
  status: FamilyGoalStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalDeposit {
  id: string;
  amount: number;
  childId: string;
  childName?: string;
  createdAt: string;
}

export const goalsApi = {
  list: (): Promise<FamilyGoal[]> => fetchWithAuth("/api/goals"),

  create: (data: {
    title: string;
    emoji?: string;
    description?: string;
    targetStars: number;
  }): Promise<FamilyGoal> =>
    fetchWithAuth("/api/goals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deposits: (goalId: string): Promise<GoalDeposit[]> =>
    fetchWithAuth(`/api/goals/${goalId}/deposits`),

  deposit: (
    goalId: string,
    data: { amount: number; childId?: string },
  ): Promise<{
    goal: FamilyGoal;
    currentStars: number;
    deposited: number;
    reachedGoal: boolean;
    message: string;
  }> =>
    fetchWithAuth(`/api/goals/${goalId}/deposit`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  complete: (goalId: string): Promise<{ goal: FamilyGoal; message: string }> =>
    fetchWithAuth(`/api/goals/${goalId}/complete`, { method: "PATCH" }),

  cancel: (
    goalId: string,
  ): Promise<{ goal: FamilyGoal; refundedChildren: number; message: string }> =>
    fetchWithAuth(`/api/goals/${goalId}/cancel`, { method: "PATCH" }),
};

// ============ EVENTOS SURPRESA ============
export interface RewardEvent {
  id: string;
  familyId: string;
  name: string;
  emoji: string;
  multiplier: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  isLive?: boolean;
  createdAt: string;
}

export const eventsApi = {
  list: (): Promise<RewardEvent[]> => fetchWithAuth("/api/events"),

  create: (data: {
    name: string;
    emoji?: string;
    multiplier: number;
    startsAt: string;
    endsAt: string;
  }): Promise<RewardEvent> =>
    fetchWithAuth("/api/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deactivate: (id: string): Promise<RewardEvent & { message: string }> =>
    fetchWithAuth(`/api/events/${id}/deactivate`, { method: "PATCH" }),
};

export const historyApi = {
  list: (childId?: string): Promise<HistoryEntry[]> =>
    fetchWithAuth(withChild("/api/history", childId)),

  getByRange: (
    startDate: string,
    endDate: string,
    childId?: string,
  ): Promise<HistoryEntry[]> =>
    fetchWithAuth(
      withChild(
        `/api/history/range?startDate=${startDate}&endDate=${endDate}`,
        childId,
      ),
    ),

  getStatistics: (childId?: string) =>
    fetchWithAuth(withChild("/api/history/statistics", childId)),
};

// ============ ROTINAS ============
export interface RoutineItem {
  id: string;
  time: string;
  title: string;
  emoji: string;
  period: "morning" | "evening";
  childId?: string | null;
  recurrenceDays?: RecurrenceDay[];
  completedToday?: boolean;
}

// Interface da API (campos reais retornados)
interface ApiRoutine {
  id: string;
  childId?: string | null;
  name: string;
  emoji: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  scheduledTime: string | null;
  recurrenceDays?: RecurrenceDay[];
  active: boolean;
  sortOrder: number;
  completedToday?: boolean;
}

// Mapeia rotina da API para o formato do frontend
function mapRoutine(apiRoutine: ApiRoutine): RoutineItem {
  // Mapeia timeOfDay para period (afternoon e night viram evening)
  const period: "morning" | "evening" =
    apiRoutine.timeOfDay === "morning" ? "morning" : "evening";

  return {
    id: apiRoutine.id,
    title: apiRoutine.name,
    emoji: apiRoutine.emoji,
    time: apiRoutine.scheduledTime || "",
    period,
    childId: apiRoutine.childId ?? null,
    recurrenceDays: apiRoutine.recurrenceDays ?? [],
    completedToday: apiRoutine.completedToday || false,
  };
}

export const routinesApi = {
  list: async (childId?: string): Promise<RoutineItem[]> => {
    const data: ApiRoutine[] = await fetchWithAuth(
      withChild("/api/routines", childId),
    );
    return data.map(mapRoutine);
  },

  create: async (data: {
    time: string;
    title: string;
    emoji: string;
    period: "morning" | "evening";
    childId?: string | null;
    recurrenceDays?: RecurrenceDay[];
  }): Promise<RoutineItem> => {
    // Mapeia para o formato da API
    const apiData = {
      childId: data.childId ?? undefined,
      name: data.title,
      emoji: data.emoji,
      scheduledTime: data.time,
      timeOfDay: data.period === "morning" ? "morning" : "night",
      recurrenceDays: data.recurrenceDays ?? [],
    };
    const result = await fetchWithAuth("/api/routines", {
      method: "POST",
      body: JSON.stringify(apiData),
    });
    return mapRoutine(result);
  },

  update: async (
    id: string,
    data: Partial<RoutineItem>,
  ): Promise<RoutineItem> => {
    // Mapeia para o formato da API
    const apiData: Record<string, unknown> = {};
    if (data.title) apiData.name = data.title;
    if (data.emoji) apiData.emoji = data.emoji;
    if (data.time) apiData.scheduledTime = data.time;
    if (data.period)
      apiData.timeOfDay = data.period === "morning" ? "morning" : "night";
    if (data.childId !== undefined) apiData.childId = data.childId;
    if (data.recurrenceDays !== undefined)
      apiData.recurrenceDays = data.recurrenceDays;

    const result = await fetchWithAuth(`/api/routines/${id}`, {
      method: "PATCH",
      body: JSON.stringify(apiData),
    });
    return mapRoutine(result);
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

  getTodayProgress: (
    childId?: string,
  ): Promise<{ total: number; completed: number; completedIds: string[] }> =>
    fetchWithAuth(withChild("/api/routines/progress/today", childId)),
};

// ============ STREAKS ============
export interface StreakData {
  currentStreak: number;
  multiplier: number;
  longestStreak: number;
  streakFreezes: number;
  lastStreakDate: string | null;
  streakBrokenAt?: string | null;
  plant?: {
    state: "healthy" | "withered" | "protected" | "seed";
    stage: "seed" | "sprout" | "leafy" | "budding" | "blooming" | "withered";
    emoji: string;
    label: string;
    streakBrokenAt: string | null;
    protectedByFreezes: boolean;
    nextGrowthAt: number | null;
  };
  nextMultiplierThreshold: number | null;
}

export const streaksApi = {
  get: (childId?: string): Promise<StreakData> =>
    fetchWithAuth(withChild("/api/streaks", childId)),

  // Responsável concede "congelamentos" ao inventário da criança
  grantFreezes: (
    childId: string,
    amount: number,
  ): Promise<{ streakFreezes: number; message: string }> =>
    fetchWithAuth("/api/streaks/freezes", {
      method: "PATCH",
      body: JSON.stringify({ childId, amount }),
    }),
};

// ============ MODO FOCO ============
export type FocusSessionStatus = "running" | "completed" | "abandoned";

export interface FocusSession {
  id: string;
  childId: string;
  missionId: string | null;
  durationMinutes: number;
  status: FocusSessionStatus;
  startedAt: string;
  endedAt: string | null;
  missionTitle?: string | null;
  message?: string;
}

export const focusApi = {
  start: (data: {
    missionId?: string;
    durationMinutes: number;
  }): Promise<FocusSession> =>
    fetchWithAuth("/api/focus/start", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  complete: (id: string): Promise<FocusSession> =>
    fetchWithAuth(`/api/focus/${id}/complete`, { method: "PATCH" }),

  abandon: (id: string): Promise<FocusSession> =>
    fetchWithAuth(`/api/focus/${id}/abandon`, { method: "PATCH" }),

  history: (childId?: string): Promise<FocusSession[]> =>
    fetchWithAuth(withChild("/api/focus", childId)),
};

// ============ TERAPEUTAS ============
export interface TherapistLink {
  therapistId: string;
  name: string;
  email: string;
  childId: string;
  childName?: string;
  linkedAt: string;
}

export interface TimelineEvent {
  kind: "history" | "school_report" | "observation";
  at: string;
  type?: string;
  description?: string;
  starsChange?: number;
  date?: string;
  rating?: number | null;
  text?: string;
  starsAwarded?: number;
  authorName?: string;
  authorRole?: UserRole;
}

export interface TherapistTimeline {
  child: {
    id: string;
    name: string;
    currentStars: number;
    currentStreak: number;
    longestStreak: number;
  };
  since: string;
  events: TimelineEvent[];
}

export const therapistsApi = {
  // Responsável cria/reaproveita a conta e vincula à criança
  createOrLink: (data: {
    childId: string;
    email: string;
    name?: string;
    password?: string;
  }) =>
    fetchWithAuth("/api/therapists", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listForParent: (): Promise<TherapistLink[]> =>
    fetchWithAuth("/api/therapists"),

  unlink: (therapistId: string, childId: string) =>
    fetchWithAuth(`/api/therapists/${therapistId}/children/${childId}`, {
      method: "DELETE",
    }),

  // Visão da terapeuta
  patients: (): Promise<Student[]> => fetchWithAuth("/api/therapists/patients"),

  timeline: (childId: string, days?: number): Promise<TherapistTimeline> =>
    fetchWithAuth(
      `/api/therapists/patients/${childId}/timeline${days ? `?days=${days}` : ""}`,
    ),

  analytics: (childId: string, days?: number) =>
    fetchWithAuth(
      `/api/therapists/patients/${childId}/analytics${days ? `?days=${days}` : ""}`,
    ),
};

// ============ OBSERVAÇÕES (adults-only) ============
export interface Observation {
  id: string;
  date: string;
  type: "clinical" | "behavioral" | "general";
  text: string;
  authorName?: string;
  authorRole?: UserRole;
  createdAt: string;
}

export const observationsApi = {
  create: (data: {
    childId: string;
    text: string;
    type?: Observation["type"];
    date?: string;
  }): Promise<Observation> =>
    fetchWithAuth("/api/observations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: (childId: string): Promise<Observation[]> =>
    fetchWithAuth(`/api/observations?childId=${childId}`),
};

// ============ PET VIRTUAL (Planta da Consistência) ============
export type PetStage = "seed" | "sprout" | "growing" | "blooming";
export type PetMood = "happy" | "thirsty" | "hungry" | "sad";
export type ShopItemType = "water" | "food" | "skin" | "background" | "effect";

export interface PetCosmetic {
  id: string;
  name: string;
  emoji: string;
}

export interface VirtualPet {
  id: string;
  childId: string;
  name: string;
  waterLevel: number;
  nutritionLevel: number;
  xp: number;
  stage: PetStage;
  mood: PetMood;
  wilted: boolean;
  sick: boolean;
  sickSince: string | null;
  skin: PetCosmetic | null;
  background: PetCosmetic | null;
  effect: PetCosmetic | null;
}

export interface PetShopItem {
  id: string;
  type: ShopItemType;
  name: string;
  emoji: string;
  description: string | null;
  price: number;
  restoreAmount: number;
  familyId: string | null;
  active: boolean;
}

export interface PetInventoryItem {
  shopItemId: string;
  name: string;
  emoji: string;
  type: ShopItemType;
  restoreAmount: number;
  quantity: number;
  equipped: boolean;
}

export const petApi = {
  get: (childId?: string): Promise<VirtualPet> =>
    fetchWithAuth(withChild("/api/pet", childId)),

  rename: (name: string): Promise<{ name: string; message: string }> =>
    fetchWithAuth("/api/pet/name", {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  care: (
    shopItemId: string,
  ): Promise<{
    waterLevel: number;
    nutritionLevel: number;
    xp: number;
    stage: PetStage;
    mood: PetMood;
    remaining: number;
    message: string;
  }> =>
    fetchWithAuth("/api/pet/care", {
      method: "POST",
      body: JSON.stringify({ shopItemId }),
    }),

  shop: (): Promise<PetShopItem[]> => fetchWithAuth("/api/pet/shop"),

  buy: (
    itemId: string,
  ): Promise<{ quantity: number; currentStars: number; message: string }> =>
    fetchWithAuth(`/api/pet/shop/${itemId}/buy`, { method: "POST" }),

  inventory: (childId?: string): Promise<PetInventoryItem[]> =>
    fetchWithAuth(withChild("/api/pet/inventory", childId)),

  equip: (itemId: string): Promise<{ equipped: boolean; message: string }> =>
    fetchWithAuth(`/api/pet/inventory/${itemId}/equip`, { method: "PATCH" }),

  // Economia Botânica (responsável)
  createShopItem: (data: {
    type: ShopItemType;
    name: string;
    emoji?: string;
    description?: string;
    price: number;
    restoreAmount?: number;
  }): Promise<PetShopItem> =>
    fetchWithAuth("/api/pet/shop-items", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateShopItem: (
    id: string,
    data: Partial<{
      name: string;
      emoji: string;
      description: string;
      price: number;
      restoreAmount: number;
      active: boolean;
    }>,
  ): Promise<PetShopItem> =>
    fetchWithAuth(`/api/pet/shop-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  removeShopItem: (id: string) =>
    fetchWithAuth(`/api/pet/shop-items/${id}`, {
      method: "DELETE",
    }),
};

// ============ NOTIFICAÇÕES ============
export interface AppNotification {
  id: string;
  type:
    | "pet_thirsty"
    | "pet_sick"
    | "approval_pending"
    | "weekly_summary"
    | "daily_penalty"
    | "general";
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  list: (): Promise<AppNotification[]> => fetchWithAuth("/api/notifications"),
  unreadCount: (): Promise<{ unread: number }> =>
    fetchWithAuth("/api/notifications/unread-count"),
  readAll: (): Promise<{ marked: number }> =>
    fetchWithAuth("/api/notifications/read-all", { method: "PATCH" }),
};

// ============ CONFIGURAÇÕES DA FAMÍLIA ============
export interface FamilySettings {
  applyDailyPenalty: boolean;
  dailyPenaltyStars: number;
}

export const settingsApi = {
  get: (): Promise<FamilySettings> => fetchWithAuth("/api/settings"),
  update: (data: Partial<FamilySettings>): Promise<FamilySettings> =>
    fetchWithAuth("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ============ RELATÓRIOS ============
export interface CompiledReport {
  child: {
    id: string;
    name: string;
    currentStars: number;
    currentStreak: number;
    longestStreak: number;
    streakFreezes: number;
  };
  period: { since: string; days: number };
  totals: {
    starsEarned: number;
    starsLost: number;
    tasksApproved: number;
    manualPenalties: number;
    automaticPenalties: number;
    freezesUsed: number;
    observations: number;
    schoolReports: number;
  };
  events: {
    at: string;
    category: string;
    author: string;
    description: string;
    starsChange: number | null;
  }[];
}

export const reportsApi = {
  compile: (childId: string, days = 30): Promise<CompiledReport> =>
    fetchWithAuth(`/api/reports/compile?childId=${childId}&days=${days}`),

  // CSV exige o header de auth: baixa como blob e dispara o download
  downloadCsv: async (
    childId: string,
    childName: string,
    days = 30,
  ): Promise<void> => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const response = await fetch(
      `${API_BASE_URL}/api/reports/export.csv?childId=${childId}&days=${days}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );
    if (!response.ok) throw new Error("Não foi possível gerar o CSV");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${childName.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },
};

// ============ MENSAGENS (professor ↔ terapeuta) ============
export interface ChatMessage {
  id: string;
  childId: string;
  text: string;
  senderId: string;
  senderName?: string;
  senderRole?: UserRole;
  mine: boolean;
  readAt: string | null;
  createdAt: string;
}

export const messagesApi = {
  send: (data: {
    childId: string;
    recipientId: string;
    text: string;
  }): Promise<ChatMessage> =>
    fetchWithAuth("/api/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  contacts: (
    childId: string,
  ): Promise<{ id: string; name: string; role: UserRole }[]> =>
    fetchWithAuth(`/api/messages/contacts?childId=${childId}`),

  thread: (childId: string, withUserId: string): Promise<ChatMessage[]> =>
    fetchWithAuth(
      `/api/messages/thread?childId=${childId}&withUserId=${withUserId}`,
    ),

  unreadCount: (): Promise<{ unread: number }> =>
    fetchWithAuth("/api/messages/unread-count"),
};

// ============ MYSTERY BOX ============
export interface MysteryPrize {
  id: string;
  name: string;
  emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  description: string;
  weight?: number;
}

export interface MysteryBoxConfig {
  cost: number;
  prizes: MysteryPrize[];
}

export const mysteryBoxApi = {
  getConfig: (): Promise<MysteryBoxConfig> => fetchWithAuth("/api/mystery-box"),

  open: (
    childId?: string,
  ): Promise<{ prize: MysteryPrize; newBalance: number }> =>
    fetchWithAuth(withChild("/api/mystery-box/open", childId), {
      method: "POST",
    }),

  listPrizes: (): Promise<MysteryPrize[]> =>
    fetchWithAuth("/api/mystery-box/prizes"),

  createPrize: (data: {
    name: string;
    emoji: string;
    rarity: MysteryPrize["rarity"];
    description: string;
    weight?: number;
  }) =>
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
};
