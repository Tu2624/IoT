<script setup lang="ts">
import type { KpiCard } from '../types/dashboard'

defineProps<{ card: KpiCard }>()
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <p class="text-sm font-medium text-gray-500">
        {{ card.label }}
      </p>
      <span class="text-xl leading-none">{{ card.icon }}</span>
    </div>
    <p class="mt-3 text-2xl font-bold text-gray-900">
      {{ card.value }}
    </p>
    <p
      :class="[
        'mt-1 text-xs font-medium',
        card.trend === 'up' ? 'text-emerald-600' : card.trend === 'down' ? 'text-red-500' : 'text-gray-400',
      ]"
    >
      {{ card.change }}
    </p>
  </div>
</template>
