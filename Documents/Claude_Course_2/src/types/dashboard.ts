export interface KpiCard {
  id: string
  label: string
  value: string
  rawValue: number
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: string
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface ChartSeries {
  id: string
  name: string
  color: string
  data: ChartDataPoint[]
}

export interface RevenueChartConfig {
  title: string
  subtitle?: string
  series: ChartSeries[]
  yAxisLabel?: string
  fillArea: boolean
}

export interface ActivityItem {
  id: string
  actor: string
  action: string
  target: string
  timestamp: string
  avatarInitials: string
  avatarColor: string
}

export interface GoalItem {
  id: string
  label: string
  current: number
  target: number
  unit: string
  color: string
}
