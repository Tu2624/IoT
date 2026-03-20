import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Transaction, ActivityItem, KpiCard, GoalItem } from '../types/dashboard'
import {
  transactions as seedTransactions,
  activityFeed as seedActivityFeed,
  kpiCards as seedKpiCards,
  goals as seedGoals,
} from '../data/mockData'

export const useDashboardStore = defineStore('dashboard', () => {
  const transactions = ref<Transaction[]>([...seedTransactions])
  const activityFeed = ref<ActivityItem[]>([...seedActivityFeed])
  const kpiCards = ref<KpiCard[]>([...seedKpiCards])
  const goals = ref<GoalItem[]>([...seedGoals])

  function addTransaction(t: Omit<Transaction, 'id'>): void {
    transactions.value.unshift({ ...t, id: crypto.randomUUID() })
  }

  function deleteTransaction(id: string): void {
    const index = transactions.value.findIndex((t) => t.id === id)
    if (index !== -1) transactions.value.splice(index, 1)
  }

  const transactionCount = computed(() => transactions.value.length)

  const totalIncome = computed(() =>
    transactions.value
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
  )

  const totalExpenses = computed(() =>
    transactions.value
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  )

  return {
    transactions,
    activityFeed,
    kpiCards,
    goals,
    addTransaction,
    deleteTransaction,
    transactionCount,
    totalIncome,
    totalExpenses,
  }
})
