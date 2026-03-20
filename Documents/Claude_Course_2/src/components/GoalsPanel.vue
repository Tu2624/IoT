<script setup lang="ts">
import type { GoalItem } from '../types/dashboard'

defineProps<{ goals: GoalItem[], title?: string }>()

function pct(item: GoalItem): number {
  return Math.min(100, Math.round((item.current / item.target) * 100))
}
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <p class="mb-4 text-sm font-semibold text-gray-700">
      {{ title ?? 'Goals' }}
    </p>
    <ul class="space-y-4">
      <li
        v-for="goal in goals"
        :key="goal.id"
      >
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm text-gray-700">{{ goal.label }}</span>
          <span class="text-xs font-semibold text-gray-500">{{ pct(goal) }}%</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            :class="['h-full rounded-full transition-all duration-500', goal.color]"
            :style="{ width: pct(goal) + '%' }"
          />
        </div>
        <p class="mt-1 text-xs text-gray-400">
          {{ goal.current.toLocaleString() }} {{ goal.unit }} of {{ goal.target.toLocaleString() }} {{ goal.unit }}
        </p>
      </li>
    </ul>
  </div>
</template>
