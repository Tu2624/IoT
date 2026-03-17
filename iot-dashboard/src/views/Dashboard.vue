<template>
  <div class="dashboard">
    <!-- ===== SENSOR TOGGLE BUTTONS ===== -->
    <div class="toggles-row">
      <button
        v-for="sensor in sensors"
        :key="sensor.key"
        class="toggle-btn btn-ripple"
        :class="{ 'toggle-btn--on': sensor.enabled }"
        :style="{ background: sensor.color }"
        @click="toggleSensor(sensor)"
      >
        <span class="toggle-icon">{{ sensor.icon }}</span>
        <div class="toggle-switch" :class="{ on: sensor.enabled }">
          <div class="toggle-knob"></div>
        </div>
      </button>
    </div>

    <!-- ===== SENSOR CARDS ===== -->
    <div class="cards-row">
      <div
        v-for="sensor in sensors"
        :key="sensor.key + '-card'"
        class="sensor-card"
        :class="{ active: sensor.enabled }"
        :style="sensor.enabled ? { background: sensor.color, boxShadow: `0 8px 32px ${sensor.glow}` } : {}"
      >
        <div class="card-header">
          <span class="card-icon">{{ sensor.icon }}</span>
          <span class="card-label">{{ sensor.label }}</span>
        </div>
        <div class="card-value">
          {{ sensor.enabled && sensor.value !== null ? sensor.value : '--' }}{{ sensor.unit }}
        </div>
      </div>
    </div>

    <!-- ===== LINE CHART ===== -->
    <div class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// ===== State =====
const sensors = ref([
  { key: 'temp',  icon: '🌡️', label: 'Temperature', unit: '°C',  color: '#e53935', glow: 'rgba(229,57,53,0.35)',   enabled: false, value: null },
  { key: 'hum',   icon: '💧', label: 'humidity',     unit: '%',   color: '#1e88e5', glow: 'rgba(30,136,229,0.35)',  enabled: false, value: null },
  { key: 'light', icon: '☀️', label: 'Light',        unit: 'Lx',  color: '#f59e0b', glow: 'rgba(245,158,11,0.35)',  enabled: false, value: null },
])

const MAX_POINTS = 20
const labels    = ref([])
const tempData  = ref([])
const humData   = ref([])
const luxData   = ref([])

// ===== Chart config =====
const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    { label: 'Temperature(°C)', data: tempData.value,  borderColor: '#e53935', backgroundColor: 'rgba(229,57,53,0.08)',  pointBackgroundColor: '#e53935',  tension: 0.4, pointRadius: 3 },
    { label: 'Humidity(%)',     data: humData.value,   borderColor: '#1e88e5', backgroundColor: 'rgba(30,136,229,0.08)', pointBackgroundColor: '#1e88e5', tension: 0.4, pointRadius: 3 },
    { label: 'Light(Lux)',      data: luxData.value,   borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', pointBackgroundColor: '#f59e0b',  tension: 0.4, pointRadius: 3 },
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#8ba3cc',
        font: { size: 12, family: 'Inter' },
        usePointStyle: true,
        pointStyleWidth: 12,
      }
    },
    tooltip: {
      backgroundColor: 'rgba(13,27,62,0.95)',
      borderColor: 'rgba(30,58,110,0.6)',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#8ba3cc',
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(30,58,110,0.4)' },
      ticks: { color: '#8ba3cc', font: { size: 11 }, maxTicksLimit: 8 }
    },
    y: {
      min: 0, max: 1000,
      grid: { color: 'rgba(30,58,110,0.4)' },
      ticks: { color: '#8ba3cc', font: { size: 11 }, stepSize: 250 }
    }
  }
}

// ===== Mock data simulation =====
let interval = null
let tick = 0

function getTime() {
  const d = new Date()
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0') + ':' + d.getSeconds().toString().padStart(2,'0')
}

function pushData(temp, hum, lux) {
  labels.value.push(getTime())
  tempData.value.push(temp)
  humData.value.push(hum)
  luxData.value.push(lux)
  if (labels.value.length > MAX_POINTS) {
    labels.value.shift(); tempData.value.shift(); humData.value.shift(); luxData.value.shift()
  }
}

function simulateTick() {
  tick++
  const anySensorOn = sensors.value.some(s => s.enabled)
  if (!anySensorOn) return

  const temp  = sensors.value[0].enabled ? +(20 + Math.sin(tick * 0.2) * 5  + Math.random() * 2).toFixed(1) : null
  const hum   = sensors.value[1].enabled ? +(60 + Math.cos(tick * 0.15) * 15 + Math.random() * 3).toFixed(1) : null
  const lux   = sensors.value[2].enabled ? Math.round(400 + Math.sin(tick * 0.1) * 200 + Math.random() * 50) : null

  sensors.value[0].value = temp
  sensors.value[1].value = hum
  sensors.value[2].value = lux

  pushData(
    sensors.value[0].enabled ? temp : null,
    sensors.value[1].enabled ? hum  : null,
    sensors.value[2].enabled ? lux  : null,
  )
}

function toggleSensor(sensor) {
  sensor.enabled = !sensor.enabled
  if (!sensor.enabled) sensor.value = null
}

onMounted(() => { interval = setInterval(simulateTick, 2000) })
onUnmounted(() => clearInterval(interval))
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 28px; }

/* ===== TOGGLES ===== */
.toggles-row {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 8px 0;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 24px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  min-width: 140px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
  /* animation */
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.2s ease,
              filter 0.2s ease;
}
.toggle-btn:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 10px 32px rgba(0,0,0,0.45);
  filter: brightness(1.12);
}
.toggle-btn:active {
  transform: scale(0.96) translateY(0);
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}
.toggle-btn--on {
  box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.2);
}

.toggle-icon { font-size: 22px; }

.toggle-switch {
  width: 54px;
  height: 28px;
  background: rgba(0,0,0,0.3);
  border-radius: 50px;
  padding: 3px;
  transition: background 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  flex-shrink: 0;
}
.toggle-switch.on { background: #f9c846; }
.toggle-knob {
  width: 22px;
  height: 22px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.toggle-switch.on .toggle-knob { transform: translateX(26px); }

/* ===== SENSOR CARDS ===== */
.cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.sensor-card {
  background: #112055;
  border-radius: var(--radius-card);
  padding: 28px 32px;
  border: 1px solid rgba(30,58,110,0.5);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.25s ease,
              background 0.4s ease,
              border-color 0.4s ease;
  min-height: 130px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: default;
}
.sensor-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 16px 48px rgba(0,0,0,0.4);
}
.sensor-card.active {
  border-color: transparent;
}
.sensor-card.active:hover {
  box-shadow: 0 16px 48px rgba(0,0,0,0.45);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
}
.card-icon {
  font-size: 24px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sensor-card:hover .card-icon { transform: scale(1.2) rotate(-5deg); }

.card-value {
  font-size: 52px;
  font-weight: 800;
  letter-spacing: -2px;
  color: #fff;
  line-height: 1;
  transition: transform 0.2s ease;
}
.sensor-card:hover .card-value { transform: scale(1.04); }

/* ===== CHART ===== */
.chart-container {
  background: rgba(17, 32, 85, 0.5);
  border: 1px solid rgba(30,58,110,0.5);
  border-radius: var(--radius-card);
  padding: 24px;
  height: 320px;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.chart-container:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}
</style>
