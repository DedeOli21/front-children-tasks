"use client"

import useSWR from "swr"
import { starsApi, tasksApi, penaltiesApi, rewardsApi, type Task, type Penalty, type Reward } from "@/lib/api"

// Hook para gerenciar todos os dados do Gabriel
export function useGabrielData() {
  // Fetch de estrelas
  const {
    data: starsData,
    error: starsError,
    mutate: mutateStars,
  } = useSWR("stars", starsApi.getBalance, {
    fallbackData: { stars: 0 },
    revalidateOnFocus: false,
  })

  // Fetch de tarefas
  const {
    data: tasks,
    error: tasksError,
    mutate: mutateTasks,
  } = useSWR<Task[]>("tasks", tasksApi.list, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  // Fetch de penalidades
  const {
    data: penalties,
    error: penaltiesError,
    mutate: mutatePenalties,
  } = useSWR<Penalty[]>("penalties", penaltiesApi.list, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  // Fetch de recompensas
  const {
    data: rewards,
    error: rewardsError,
    mutate: mutateRewards,
  } = useSWR<Reward[]>("rewards", rewardsApi.list, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  const stars = starsData?.stars ?? 0

  // Completar tarefa
  const completeTask = async (taskId: string) => {
    try {
      await tasksApi.complete(taskId)
      // Atualiza otimisticamente
      mutateTasks()
      mutateStars()
      return true
    } catch (error) {
      console.error("Erro ao completar tarefa:", error)
      return false
    }
  }

  // Aplicar penalidade
  const applyPenalty = async (penaltyId: string) => {
    try {
      await penaltiesApi.apply(penaltyId)
      mutateStars()
      return true
    } catch (error) {
      console.error("Erro ao aplicar penalidade:", error)
      return false
    }
  }

  // Resgatar recompensa
  const redeemReward = async (rewardId: string) => {
    try {
      await rewardsApi.redeem(rewardId)
      mutateStars()
      return true
    } catch (error) {
      console.error("Erro ao resgatar recompensa:", error)
      return false
    }
  }

  // Resetar tarefas do dia
  const resetTasks = async () => {
    try {
      await tasksApi.resetDay()
      mutateTasks()
      return true
    } catch (error) {
      console.error("Erro ao resetar tarefas:", error)
      return false
    }
  }

  const isLoading = !starsData && !starsError
  const hasError = starsError || tasksError || penaltiesError || rewardsError

  return {
    stars,
    tasks: tasks ?? [],
    penalties: penalties ?? [],
    rewards: rewards ?? [],
    isLoading,
    hasError,
    completeTask,
    applyPenalty,
    redeemReward,
    resetTasks,
    refresh: () => {
      mutateStars()
      mutateTasks()
      mutatePenalties()
      mutateRewards()
    },
  }
}
