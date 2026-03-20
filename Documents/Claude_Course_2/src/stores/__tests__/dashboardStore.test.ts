import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from '../dashboardStore'
import {
  transactions as seedTransactions,
  activityFeed as seedActivityFeed,
  kpiCards as seedKpiCards,
  goals as seedGoals,
} from '../../data/mockData'

describe('dashboardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────────────────────

  it('seeds transactions from mockData', () => {
    const store = useDashboardStore()
    expect(store.transactions).toHaveLength(seedTransactions.length)
    expect(store.transactions[0].id).toBe(seedTransactions[0].id)
  })

  it('seeds activityFeed from mockData', () => {
    const store = useDashboardStore()
    expect(store.activityFeed).toHaveLength(seedActivityFeed.length)
  })

  it('seeds kpiCards from mockData', () => {
    const store = useDashboardStore()
    expect(store.kpiCards).toHaveLength(seedKpiCards.length)
  })

  it('seeds goals from mockData', () => {
    const store = useDashboardStore()
    expect(store.goals).toHaveLength(seedGoals.length)
  })

  // ── addTransaction ─────────────────────────────────────────────────────────

  it('addTransaction increases the list length by 1', () => {
    const store = useDashboardStore()
    const before = store.transactions.length
    store.addTransaction({
      description: 'Test payment',
      amount: 500,
      type: 'income',
      date: '2026-03-20T12:00:00Z',
      category: 'Test',
    })
    expect(store.transactions).toHaveLength(before + 1)
  })

  it('addTransaction auto-generates unique ids', () => {
    const store = useDashboardStore()
    store.addTransaction({ description: 'First',  amount: 100, type: 'income',  date: '2026-03-20T12:00:00Z', category: 'Test' })
    store.addTransaction({ description: 'Second', amount: 200, type: 'expense', date: '2026-03-20T13:00:00Z', category: 'Test' })
    const [newest, secondNewest] = store.transactions
    expect(newest.id).toBeTruthy()
    expect(secondNewest.id).toBeTruthy()
    expect(newest.id).not.toBe(secondNewest.id)
  })

  it('addTransaction places the new item at index 0', () => {
    const store = useDashboardStore()
    store.addTransaction({
      description: 'Newest entry',
      amount: 999,
      type: 'expense',
      date: '2026-03-21T08:00:00Z',
      category: 'Test',
    })
    expect(store.transactions[0].description).toBe('Newest entry')
  })

  // ── deleteTransaction ──────────────────────────────────────────────────────

  it('deleteTransaction removes the item with the given id', () => {
    const store = useDashboardStore()
    const targetId = store.transactions[0].id
    const before = store.transactions.length
    store.deleteTransaction(targetId)
    expect(store.transactions).toHaveLength(before - 1)
    expect(store.transactions.find((t) => t.id === targetId)).toBeUndefined()
  })

  it('deleteTransaction is a no-op for an unknown id', () => {
    const store = useDashboardStore()
    const before = store.transactions.length
    store.deleteTransaction('does-not-exist')
    expect(store.transactions).toHaveLength(before)
  })

  // ── Getters ────────────────────────────────────────────────────────────────

  it('transactionCount returns the number of transactions', () => {
    const store = useDashboardStore()
    expect(store.transactionCount).toBe(seedTransactions.length)
  })

  it('totalIncome sums only income transactions', () => {
    const store = useDashboardStore()
    const expected = seedTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    expect(store.totalIncome).toBe(expected)
  })

  it('totalExpenses sums only expense transactions', () => {
    const store = useDashboardStore()
    const expected = seedTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    expect(store.totalExpenses).toBe(expected)
  })

  it('transactionCount updates after addTransaction', () => {
    const store = useDashboardStore()
    const before = store.transactionCount
    store.addTransaction({ description: 'Extra', amount: 50, type: 'expense', date: '2026-03-20T09:00:00Z', category: 'Test' })
    expect(store.transactionCount).toBe(before + 1)
  })

  it('totalIncome updates after adding an income transaction', () => {
    const store = useDashboardStore()
    const before = store.totalIncome
    store.addTransaction({ description: 'Bonus', amount: 1000, type: 'income', date: '2026-03-20T10:00:00Z', category: 'Test' })
    expect(store.totalIncome).toBe(before + 1000)
  })

  it('totalExpenses updates after deleting an expense transaction', () => {
    const store = useDashboardStore()
    const expenseTxn = store.transactions.find((t) => t.type === 'expense')!
    const before = store.totalExpenses
    store.deleteTransaction(expenseTxn.id)
    expect(store.totalExpenses).toBe(before - expenseTxn.amount)
  })
})
