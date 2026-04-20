'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, CalendarDays, Lightbulb, Power, PowerOff, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import Card from '@/components/Card';

type DeviceKey = 'led_temp' | 'led_humi' | 'led_bh' | 'led_led1' | 'led_led2';
type FilterMode = 'range' | 'date';

interface DeviceSummary {
  deviceKey: DeviceKey;
  deviceName: string;
  label: string;
  onCount: number;
  offCount: number;
  totalCount: number;
}

interface DailyEntry {
  day: string;
  totalOn: number;
  totalOff: number;
  led_tempOn: number;
  led_tempOff: number;
  led_humiOn: number;
  led_humiOff: number;
  led_bhOn: number;
  led_bhOff: number;
  led_led1On: number;
  led_led1Off: number;
  led_led2On: number;
  led_led2Off: number;
}

interface StatsResponse {
  mode?: FilterMode;
  range: {
    days: number;
    start: string;
    end: string;
  };
  summaries: DeviceSummary[];
  daily: DailyEntry[];
}

function isStatsResponse(value: unknown): value is StatsResponse {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<StatsResponse>;
  return Array.isArray(candidate.summaries) && Array.isArray(candidate.daily) && !!candidate.range;
}

function formatDateInput(date: Date) {
  return moment(date).format('YYYY-MM-DD');
}

const RANGE_OPTIONS = [7, 14, 30];
const DEVICE_ACCENT: Record<DeviceKey, string> = {
  led_temp: 'from-rose-500/20 to-orange-500/10 border-rose-500/20',
  led_humi: 'from-sky-500/20 to-cyan-500/10 border-sky-500/20',
  led_bh: 'from-amber-500/20 to-yellow-500/10 border-amber-500/20',
  led_led1: 'from-emerald-500/20 to-lime-500/10 border-emerald-500/20',
  led_led2: 'from-violet-500/20 to-fuchsia-500/10 border-violet-500/20',
};

export default function LedUsagePage() {
  const [days, setDays] = useState(7);
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [filterMode, setFilterMode] = useState<FilterMode>('range');
  const [selectedDevice, setSelectedDevice] = useState<'all' | DeviceKey>('all');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set('mode', filterMode);

        if (filterMode === 'date' && selectedDate) {
          params.set('date', selectedDate);
        } else {
          params.set('days', String(days));
        }

        const response = await fetch(`/api/actions/daily-stats?${params.toString()}`);
        const json = await response.json();
        setStats(isStatsResponse(json) ? json : null);
      } catch (error) {
        console.error(error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [days, selectedDate, filterMode]);

  const summaries = stats?.summaries ?? [];
  const chartData = (stats?.daily ?? []).map((entry) => ({
    ...entry,
    dayLabel: moment(entry.day).format('DD/MM'),
  }));

  const selectedSummary = summaries.find((item) => item.deviceKey === selectedDevice);
  const selectedOnKey = selectedDevice === 'all' ? 'totalOn' : `${selectedDevice}On`;
  const selectedOffKey = selectedDevice === 'all' ? 'totalOff' : `${selectedDevice}Off`;

  const totalOn = selectedDevice === 'all'
    ? summaries.reduce((sum, item) => sum + item.onCount, 0)
    : selectedSummary?.onCount || 0;
  const totalOff = selectedDevice === 'all'
    ? summaries.reduce((sum, item) => sum + item.offCount, 0)
    : selectedSummary?.offCount || 0;

  const rangeLabel = stats
    ? `${moment(stats.range.start).format('DD/MM/YYYY')} - ${moment(stats.range.end).format('DD/MM/YYYY')}`
    : '';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Thống kê bật/tắt LED</h1>
          {stats && (
            <p className="text-xs text-slate-500 mt-2">Khoảng dữ liệu: {rangeLabel}</p>
          )}
        </div>

        <div className="flex flex-col xl:flex-row xl:items-end gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400">Chọn nhanh khoảng ngày</label>
            <select
              value={days}
              onChange={(event) => {
                setDays(Number(event.target.value));
                setFilterMode('range');
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500"
            >
              {RANGE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} ngày gần nhất
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400">Chọn ngày cụ thể</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setFilterMode('date');
                }}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setFilterMode('range')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                title="Trở về bộ lọc 7, 14, 30 ngày"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 xl:min-w-[220px]">
            <label className="text-xs font-medium text-slate-400">Thiết bị</label>
            <select
              value={selectedDevice}
              onChange={(event) => setSelectedDevice(event.target.value as 'all' | DeviceKey)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả LED</option>
              {summaries.map((device) => (
                <option key={device.deviceKey} value={device.deviceKey}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 xl:ml-auto">
            <CalendarDays className="w-4 h-4" />
            {filterMode === 'date'
              ? `Đang lọc theo ngày ${moment(selectedDate).format('DD/MM/YYYY')}`
              : `Đang lọc theo ${days} ngày gần nhất`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {summaries.map((device) => {
          const isActive = selectedDevice === device.deviceKey;

          return (
            <button
              key={device.deviceKey}
              type="button"
              onClick={() => setSelectedDevice(device.deviceKey)}
              className="text-left"
            >
              <Card
                className={clsx(
                  'p-5 h-full bg-gradient-to-br transition-all duration-300 hover:-translate-y-1',
                  DEVICE_ACCENT[device.deviceKey],
                  isActive && 'ring-1 ring-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.18)]'
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-slate-100" />
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    {device.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-400 flex items-center gap-2">
                      <Power className="w-4 h-4" />
                      Bật
                    </span>
                    <span className="text-slate-100 font-bold">{device.onCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-rose-400 flex items-center gap-2">
                      <PowerOff className="w-4 h-4" />
                      Tắt
                    </span>
                    <span className="text-slate-100 font-bold">{device.offCount}</span>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tổng sự kiện</span>
                    <span className="text-slate-300 font-semibold">{device.totalCount}</span>
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.9fr_0.9fr] gap-6">
        <Card className="p-6 min-h-[420px]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Biểu đồ theo ngày</h2>
              <p className="text-sm text-slate-400">
                {selectedDevice === 'all'
                  ? (filterMode === 'date'
                    ? 'Tổng hợp tất cả thao tác bật tắt của 5 LED trong ngày đã chọn.'
                    : `Tổng hợp tất cả thao tác bật tắt của 5 LED trong ${days} ngày gần nhất.`)
                  : (filterMode === 'date'
                    ? `Số lần bật và tắt của ${selectedSummary?.label || 'LED'} trong ngày đã chọn.`
                    : `Số lần bật và tắt của ${selectedSummary?.label || 'LED'} trong ${days} ngày gần nhất.`)}
              </p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {loading ? 'Đang tải...' : `${chartData.length} mốc ngày`}
            </div>
          </div>

          <div className="h-[320px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                Đang tải dữ liệu biểu đồ...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                {filterMode === 'date'
                  ? 'Chưa có dữ liệu bật tắt cho ngày đã chọn.'
                  : 'Chưa có dữ liệu bật tắt trong khoảng ngày đã chọn.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="dayLabel" stroke="#94a3b8" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                    }}
                    labelFormatter={(value) => `Ngày ${value}`}
                  />
                  <Legend />
                  <Bar dataKey={selectedOnKey} name="Bật" radius={[8, 8, 0, 0]} fill="#10b981" />
                  <Bar dataKey={selectedOffKey} name="Tắt" radius={[8, 8, 0, 0]} fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Tổng quan hiện tại</h2>
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-emerald-300 text-sm mb-1">Tổng số lần bật</p>
              <p className="text-3xl font-bold text-white">{totalOn}</p>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="text-rose-300 text-sm mb-1">Tổng số lần tắt</p>
              <p className="text-3xl font-bold text-white">{totalOff}</p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-slate-400 text-sm mb-2">Đang xem</p>
              <p className="text-lg font-semibold text-slate-100">
                {selectedDevice === 'all' ? 'Tất cả LED' : selectedSummary?.label || 'Tất cả LED'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Bấm vào một thẻ thống kê bên trên để đổi nhanh LED đang xem trong biểu đồ.
              </p>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
