<script setup lang="ts">
import AppLayout from './components/AppLayout.vue'

const stats = [
  { label: 'Total Revenue', value: '$45,231', change: '↑ 20.1% from last month', up: true },
  { label: 'Active Users', value: '2,350', change: '↑ 15.3% from last month', up: true },
  { label: 'New Projects', value: '12', change: '↓ 4.6% from last month', up: false },
  { label: 'Open Tickets', value: '7', change: '↑ 2 since yesterday', up: true },
]
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">
          Welcome back, Jane 👋
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          Here's what's happening today.
        </p>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <p class="text-sm text-gray-500">
            {{ stat.label }}
          </p>
          <p class="mt-2 text-2xl font-bold text-gray-900">
            {{ stat.value }}
          </p>
          <p :class="['mt-1 text-xs font-medium', stat.up ? 'text-emerald-600' : 'text-red-500']">
            {{ stat.change }}
          </p>
        </div>
      </div>

      <!-- Placeholder content -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">
          Recent Activity
        </h3>
        <div class="space-y-3">
          <div
            v-for="i in 5"
            :key="i"
            class="h-4 rounded bg-gray-100 animate-pulse"
            :style="{ width: `${75 - i * 8}%` }"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>
