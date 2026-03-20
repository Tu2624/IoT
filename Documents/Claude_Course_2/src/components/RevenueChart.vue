<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line as LineChart } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import type { RevenueChartConfig } from '../types/dashboard'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const props = defineProps<{ config: RevenueChartConfig }>()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.config.series[0]?.data.map((d) => d.label) ?? [],
  datasets: props.config.series.map((s) => ({
    label: s.name,
    data: s.data.map((d) => d.value),
    borderColor: s.color,
    backgroundColor: props.config.fillArea ? s.color + '33' : 'transparent',
    fill: props.config.fillArea,
    tension: 0.4,
    pointRadius: 3,
    pointHoverRadius: 5,
  })),
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', align: 'end' },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      title: { display: !!props.config.yAxisLabel, text: props.config.yAxisLabel },
      grid: { color: '#f3f4f6' },
      ticks: {
        callback: (val) => '$' + Number(val).toLocaleString(),
      },
    },
  },
}))
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div class="mb-4">
      <p class="text-sm font-semibold text-gray-700">
        {{ config.title }}
      </p>
      <p
        v-if="config.subtitle"
        class="text-xs text-gray-400"
      >
        {{ config.subtitle }}
      </p>
    </div>
    <div class="relative h-72 lg:h-80">
      <LineChart
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>
