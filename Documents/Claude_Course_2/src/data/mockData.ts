import type { KpiCard, ChartSeries, ActivityItem, GoalItem, Transaction } from '../types/dashboard'

export const kpiCards: KpiCard[] = [
  { id: 'revenue',  label: 'Total Revenue', value: '$45,231', rawValue: 45231, change: '↑ 20.1% from last month', trend: 'up',      icon: '💰' },
  { id: 'users',    label: 'Active Users',  value: '2,350',   rawValue: 2350,  change: '↑ 15.3% from last month', trend: 'up',      icon: '👤' },
  { id: 'projects', label: 'New Projects',  value: '12',      rawValue: 12,    change: '↓ 4.6% from last month',  trend: 'down',    icon: '📁' },
  { id: 'tickets',  label: 'Open Tickets',  value: '7',       rawValue: 7,     change: '↑ 2 since yesterday',     trend: 'neutral', icon: '🎫' },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const revenueChartSeries: ChartSeries[] = [
  {
    id: 'revenue',
    name: 'Revenue',
    color: '#6366f1',
    data: [38000, 41000, 37500, 44000, 46200, 43800, 48000, 51200, 49600, 53000, 50400, 45231]
      .map((v, i) => ({ label: months[i], value: v })),
  },
  {
    id: 'expenses',
    name: 'Expenses',
    color: '#f43f5e',
    data: [28000, 30500, 29000, 31000, 33200, 30500, 34000, 37000, 35500, 38000, 36200, 33000]
      .map((v, i) => ({ label: months[i], value: v })),
  },
]

export const activityFeed: ActivityItem[] = [
  { id: '1', actor: 'Jane Doe',   action: 'created project', target: 'Alpha Release', timestamp: '2026-03-20T09:12:00Z', avatarInitials: 'JD', avatarColor: 'bg-indigo-100' },
  { id: '2', actor: 'Mark Lee',   action: 'closed ticket',   target: '#1042',         timestamp: '2026-03-20T08:45:00Z', avatarInitials: 'ML', avatarColor: 'bg-emerald-100' },
  { id: '3', actor: 'Sara Kim',   action: 'commented on',    target: 'Q2 Roadmap',    timestamp: '2026-03-20T08:10:00Z', avatarInitials: 'SK', avatarColor: 'bg-rose-100' },
  { id: '4', actor: 'Tom Nguyen', action: 'merged PR',       target: '#289 fix: nav', timestamp: '2026-03-19T17:55:00Z', avatarInitials: 'TN', avatarColor: 'bg-amber-100' },
  { id: '5', actor: 'Jane Doe',   action: 'invited',         target: 'Alex Patel',    timestamp: '2026-03-19T16:30:00Z', avatarInitials: 'JD', avatarColor: 'bg-indigo-100' },
]

export const goals: GoalItem[] = [
  { id: 'mrr',   label: 'Monthly Recurring Revenue', current: 45231, target: 60000, unit: '$',     color: 'bg-indigo-500' },
  { id: 'users', label: 'Active User Target',        current: 2350,  target: 3000,  unit: 'users', color: 'bg-emerald-500' },
  { id: 'nps',   label: 'NPS Score',                 current: 68,    target: 80,    unit: 'pts',   color: 'bg-amber-500' },
]

export const transactions: Transaction[] = [
  { id: 'txn-1', description: 'Client invoice — Alpha Corp', amount: 12500, type: 'income',  date: '2026-03-18T09:00:00Z', category: 'Consulting' },
  { id: 'txn-2', description: 'AWS infrastructure bill',     amount: 3200,  type: 'expense', date: '2026-03-17T14:30:00Z', category: 'Infrastructure' },
  { id: 'txn-3', description: 'Freelance design work',       amount: 4800,  type: 'income',  date: '2026-03-15T11:00:00Z', category: 'Design' },
  { id: 'txn-4', description: 'SaaS tool subscriptions',     amount: 680,   type: 'expense', date: '2026-03-14T08:00:00Z', category: 'Software' },
  { id: 'txn-5', description: 'Retainer — Beta Startup',     amount: 8000,  type: 'income',  date: '2026-03-12T16:45:00Z', category: 'Consulting' },
  { id: 'txn-6', description: 'Office supplies',             amount: 240,   type: 'expense', date: '2026-03-10T10:20:00Z', category: 'Operations' },
]
