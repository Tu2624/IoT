<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const navItems = [
  { label: 'Dashboard', icon: '🏠' },
  { label: 'Analytics', icon: '📊' },
  { label: 'Projects', icon: '📁' },
  { label: 'Team', icon: '👥' },
  { label: 'Settings', icon: '⚙️' },
]
</script>

<template>
  <!-- Mobile overlay -->
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-20 bg-black/40 lg:hidden"
      @click="$emit('close')"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white border-r border-gray-200 shadow-sm',
      'transition-transform duration-300 ease-in-out',
      'lg:translate-x-0 lg:static lg:z-auto lg:shadow-none',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <!-- Logo -->
    <div class="flex h-16 items-center gap-3 border-b border-gray-200 px-5">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
        A
      </div>
      <span class="text-lg font-semibold text-gray-900">Acme App</span>
    </div>

    <!-- Nav items -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      <a
        v-for="item in navItems"
        :key="item.label"
        href="#"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
      >
        <span class="text-base leading-none">{{ item.icon }}</span>
        {{ item.label }}
      </a>
    </nav>

    <!-- User footer -->
    <div class="border-t border-gray-200 px-4 py-4">
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
          JD
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-gray-900">
            Jane Doe
          </p>
          <p class="truncate text-xs text-gray-500">
            jane@example.com
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
