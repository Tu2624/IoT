<script setup lang="ts">
import { storeToRefs } from 'pinia'
import KpiCard from '../components/KpiCard.vue'
import RevenueChart from '../components/RevenueChart.vue'
import ActivityFeed from '../components/ActivityFeed.vue'
import GoalsPanel from '../components/GoalsPanel.vue'
import { revenueChartSeries } from '../data/mockData'
import { useDashboardStore } from '../stores/dashboardStore'
import type { RevenueChartConfig } from '../types/dashboard'

const store = useDashboardStore()
const { kpiCards, activityFeed, goals } = storeToRefs(store)

const chartConfig: RevenueChartConfig = {
  title: 'Revenue vs. Expenses',
  subtitle: 'Last 12 months',
  series: revenueChartSeries,
  yAxisLabel: 'USD',
  fillArea: true,
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900">
        Welcome back, Jane 👋
      </h2>
      <p class="mt-1 text-sm text-gray-500">
        Here's what's happening today.
      </p>
    </div>

    <!-- Bento grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Row 1: KPI cards — 1 col each -->
      <KpiCard
        v-for="card in kpiCards"
        :key="card.id"
        :card="card"
        class="col-span-1"
      />

      <!-- Row 2: Revenue chart — full width -->
      <div class="col-span-1 sm:col-span-2 lg:col-span-4">
        <RevenueChart :config="chartConfig" />
      </div>

      <!-- Row 3: Activity feed + Goals — half width each -->
      <div class="col-span-1 sm:col-span-2 lg:col-span-2">
        <ActivityFeed :items="activityFeed" />
      </div>
      <div class="col-span-1 sm:col-span-2 lg:col-span-2">
        <GoalsPanel :goals="goals" />
      </div>
    </div>
  </div>
</template>
