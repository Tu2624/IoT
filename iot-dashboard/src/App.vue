<template>
  <div class="app-layout">
    <!-- ===== NAVBAR ===== -->
    <header class="navbar">
      <div class="navbar-brand">
        <span class="brand-icon">📡</span>
        <span class="brand-name">IoT Sensor</span>
      </div>
      <nav class="navbar-nav">
        <RouterLink to="/dashboard"      class="nav-item" :class="{ active: $route.path === '/dashboard' }">
          <span class="nav-icon">⊞</span> Dashboard
        </RouterLink>
        <RouterLink to="/data-sensor"    class="nav-item" :class="{ active: $route.path === '/data-sensor' }">
          <span class="nav-icon">📈</span> DataSensor
        </RouterLink>
        <RouterLink to="/action-history" class="nav-item" :class="{ active: $route.path === '/action-history' }">
          <span class="nav-icon">🕐</span> ActionHistory
        </RouterLink>
      </nav>
      <RouterLink to="/profile" class="navbar-avatar">
        <img src="https://i.pravatar.cc/40?img=68" alt="avatar" />
      </RouterLink>
    </header>

    <!-- ===== PAGE CONTENT with route transition ===== -->
    <main class="page-content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #0d1b3e 50%, #0a1628 100%);
}

/* ===== NAVBAR ===== */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 68px;
  background: rgba(13, 27, 62, 0.95);
  border-bottom: 1px solid rgba(30, 58, 110, 0.6);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-icon { font-size: 22px; }
.brand-name {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.3px;
}

.navbar-nav {
  display: flex;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 50px;
  padding: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 20px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
  transition: color 0.25s ease, background 0.25s ease, transform 0.15s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.nav-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.1);
  border-radius: inherit;
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}
.nav-item:hover { color: #fff; background: rgba(255,255,255,0.08); transform: translateY(-1px); }
.nav-item:active { transform: scale(0.96); }
.nav-item:active::after { opacity: 1; transform: scale(1); transition: none; }
.nav-item.active {
  background: rgba(30, 136, 229, 0.25);
  color: #fff;
  border: 1px solid rgba(30, 136, 229, 0.5);
}
.nav-icon { font-size: 16px; }

.navbar-avatar {
  display: flex;
  cursor: pointer;
}
.navbar-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(30, 136, 229, 0.5);
  object-fit: cover;
  transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}
.navbar-avatar:hover img {
  border-color: rgba(30, 136, 229, 1);
  transform: scale(1.1);
  box-shadow: 0 0 12px rgba(30, 136, 229, 0.6);
}
.navbar-avatar:active img { transform: scale(0.95); }

/* ===== PAGE CONTENT ===== */
.page-content {
  flex: 1;
  padding: 32px;
}
</style>
