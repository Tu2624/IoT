<template>
  <div class="page">
    <!-- ===== TOP BAR ===== -->
    <div class="top-bar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input v-model="search" class="search-input" placeholder="Search..." @input="currentPage = 1" />
      </div>
      <button class="btn-sort btn-ripple" @click="toggleSort">
        SORT {{ sortAsc ? '↑' : '↓' }}
      </button>
    </div>

    <!-- ===== FILTER ROW ===== -->
    <div class="filter-row">
      <div class="filter-left">
        <span class="filter-icon">📅</span>
        <span class="filter-label">Lọc theo cảm biến</span>
        <select v-model="filterType" class="filter-select" @change="currentPage = 1">
          <option value="">Tất cả</option>
          <option value="Cảm biến nhiệt độ">Cảm biến nhiệt độ</option>
          <option value="Cảm biến độ ẩm">Cảm biến độ ẩm</option>
          <option value="Cảm biến ánh sáng">Cảm biến ánh sáng</option>
        </select>
      </div>
      <button class="btn-export btn-ripple" @click="exportCsv">
        <span>⬇</span> Xuất Excel
      </button>
    </div>

    <!-- ===== TABLE ===== -->
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên cảm biến</th>
            <th>Trạng thái</th>
            <th>Thời gian</th>
            <th>Giá trị</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paginated" :key="row.id" class="table-row">
            <td class="td-id">{{ String(row.id).padStart(2, '0') }}</td>
            <td>{{ row.name }}</td>
            <td>
              <span class="badge" :class="statusClass(row.status)">{{ row.status }}</span>
            </td>
            <td class="td-time">{{ row.time }}</td>
            <td>
              <span class="badge" :class="row.value === 'On' ? 'badge-on' : 'badge-off'">
                {{ row.value }}
              </span>
            </td>
          </tr>
          <tr v-if="paginated.length === 0">
            <td colspan="5" class="empty">Không có dữ liệu</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== PAGINATION ===== -->
    <div class="pagination">
      <button class="page-btn btn-ripple" :disabled="currentPage === 1" @click="currentPage--">← Prev 10</button>
      <button
        v-for="p in visiblePages"
        :key="p"
        class="page-btn btn-ripple"
        :class="{ active: currentPage === p }"
        @click="currentPage = p"
      >{{ p }}</button>
      <span v-if="totalPages > 6" class="page-dots">…</span>
      <button v-if="totalPages > 6" class="page-btn btn-ripple" :class="{ active: currentPage === totalPages }" @click="currentPage = totalPages">{{ totalPages }}</button>
      <button class="page-btn btn-ripple" :disabled="currentPage === totalPages" @click="currentPage++">Next 10 →</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const sensorTypes = ['Cảm biến nhiệt độ', 'Cảm biến độ ẩm', 'Cảm biến ánh sáng']
const statuses    = ['Wating', 'On', 'Off', 'Off', 'On', 'On', 'Wating']

function randomTime(id) {
  const d = new Date()
  d.setMinutes(d.getMinutes() - id * 2)
  const hh = String(d.getHours()).padStart(2,'0')
  const mm = String(d.getMinutes()).padStart(2,'0')
  const dd = String(d.getDate()).padStart(2,'0')
  const mo = String(d.getMonth()+1).padStart(2,'0')
  return `${hh}:${mm}-${dd}/${mo}/${d.getFullYear()}`
}

const allRows = ref(Array.from({ length: 80 }, (_, i) => {
  const status = statuses[i % statuses.length]
  return {
    id: i + 1,
    name: sensorTypes[i % 3],
    status,
    time: randomTime(i),
    value: status === 'Off' ? 'Off' : 'On',
  }
}))

const search      = ref('')
const filterType  = ref('')
const sortAsc     = ref(false)
const currentPage = ref(1)
const PER_PAGE    = 10

const filtered = computed(() => {
  let rows = allRows.value
  if (filterType.value) rows = rows.filter(r => r.name === filterType.value)
  if (search.value)     rows = rows.filter(r =>
    r.name.toLowerCase().includes(search.value.toLowerCase()) ||
    r.status.toLowerCase().includes(search.value.toLowerCase())
  )
  return [...rows].sort((a, b) => sortAsc.value ? a.id - b.id : b.id - a.id)
})

const totalPages  = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)))
const paginated   = computed(() => {
  const start = (currentPage.value - 1) * PER_PAGE
  return filtered.value.slice(start, start + PER_PAGE)
})
const visiblePages = computed(() => {
  const tp = totalPages.value
  const cp = currentPage.value
  const pages = []
  for (let i = 1; i <= Math.min(6, tp); i++) pages.push(i)
  if (cp > 6 && !pages.includes(cp)) pages.push(cp)
  return [...new Set(pages)].sort((a, b) => a - b)
})

function statusClass(status) {
  if (status === 'Wating') return 'badge-waiting'
  if (status === 'Off')    return 'badge-off'
  return 'badge-on-text'
}
function toggleSort() { sortAsc.value = !sortAsc.value; currentPage.value = 1 }

function exportCsv() {
  const header = 'ID,Tên cảm biến,Trạng thái,Thời gian,Giá trị\n'
  const body = filtered.value.map(r =>
    `${r.id},"${r.name}",${r.status},"${r.time}",${r.value}`
  ).join('\n')
  const blob = new Blob(['\uFEFF' + header + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'action_history.csv'; a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }

.top-bar { display: flex; gap: 16px; align-items: center; }
.search-wrap {
  flex: 1; display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 50px; padding: 0 20px; height: 50px;
  transition: box-shadow 0.25s ease;
}
.search-wrap:focus-within { box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.35); }
.search-icon { font-size: 16px; color: #888; }
.search-input {
  flex: 1; border: none; outline: none;
  font-size: 15px; background: transparent; color: #222; font-family: 'Inter', sans-serif;
}
.btn-sort {
  height: 50px; padding: 0 32px;
  background: #1e3a8a; color: #fff; border: none; border-radius: 50px;
  font-size: 15px; font-weight: 700; cursor: pointer; letter-spacing: 1px;
  transition: background 0.2s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}
.btn-sort:hover { background: #1e4db5; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(30,58,138,0.5); }
.btn-sort:active { transform: scale(0.96); transition: transform 0.08s ease; }

.filter-row {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(17,32,85,0.5); border: 1px solid rgba(30,58,110,0.5);
  border-radius: var(--radius-card); padding: 14px 24px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.filter-row:hover { border-color: rgba(30,58,110,0.9); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
.filter-left { display: flex; align-items: center; gap: 12px; font-weight: 500; }
.filter-icon { font-size: 18px; }
.filter-label { font-size: 15px; color: rgba(255,255,255,0.85); }
.filter-select {
  background: rgba(255,255,255,0.12); color: #fff;
  border: 1px solid rgba(255,255,255,0.2); border-radius: 50px;
  padding: 6px 16px; font-size: 14px; cursor: pointer; outline: none; font-family: 'Inter', sans-serif;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.filter-select:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); }
.filter-select option { background: #112055; }
.btn-export {
  display: flex; align-items: center; gap: 8px; padding: 10px 24px;
  background: rgba(17,32,85,0.8); color: #fff;
  border: 1px solid rgba(30,58,110,0.7); border-radius: 50px;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.2s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}
.btn-export:hover { background: #1e3a8a; border-color: #1e4db5; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(30,58,138,0.4); }
.btn-export:active { transform: scale(0.96); transition: transform 0.08s ease; }

/* TABLE */
.table-wrap {
  background: rgba(17,32,85,0.4); border: 1px solid rgba(30,58,110,0.5);
  border-radius: var(--radius-card); overflow: hidden;
  transition: box-shadow 0.25s ease;
}
.table-wrap:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.25); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  padding: 16px 20px; text-align: center;
  font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.75);
  background: rgba(13,27,62,0.6); border-bottom: 1px solid rgba(30,58,110,0.5);
}
.data-table td {
  padding: 13px 20px; text-align: center;
  font-size: 14px; color: rgba(255,255,255,0.85);
  border-bottom: 1px solid rgba(30,58,110,0.25);
  transition: background 0.2s ease;
}
.table-row { transition: background 0.2s ease; }
.table-row:hover { background: rgba(30,58,110,0.35) !important; }
.table-row:hover td { color: #fff; }
.data-table tbody tr:nth-child(even) { background: rgba(255,255,255,0.02); }
.data-table tbody tr:last-child td { border-bottom: none; }

.td-id   { font-weight: 700; color: rgba(255,255,255,0.55); }
.td-time { font-size: 13px; color: rgba(255,255,255,0.6); }

.badge {
  display: inline-block; padding: 5px 22px; border-radius: 6px;
  font-weight: 700; font-size: 14px; min-width: 70px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.badge:hover { transform: scale(1.08); }
.badge-waiting { background: #f59e0b; color: #000; }
.badge-off     { background: #e53935; color: #fff; }
.badge-on-text { background: transparent; color: #22c55e; font-weight: 700; }
.badge-on      { background: #22c55e; color: #fff; }
.empty { color: rgba(255,255,255,0.4); font-style: italic; padding: 40px; }

/* PAGINATION */
.pagination { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 8px 0; }
.page-btn {
  padding: 8px 16px; border-radius: 8px;
  border: 1px solid rgba(30,58,110,0.6); background: rgba(17,32,85,0.5);
  color: rgba(255,255,255,0.7); font-size: 14px; cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.2s ease, color 0.2s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}
.page-btn:hover:not(:disabled) { background: #1e3a8a; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(30,58,138,0.4); }
.page-btn:active:not(:disabled) { transform: scale(0.93); transition: transform 0.08s ease; }
.page-btn.active { background: #1e3a8a; color: #fff; border-color: #1e4db5; font-weight: 700; box-shadow: 0 0 0 2px rgba(30,136,229,0.4); }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-dots { color: rgba(255,255,255,0.5); padding: 0 4px; }
</style>
