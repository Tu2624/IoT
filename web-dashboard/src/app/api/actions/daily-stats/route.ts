import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

const DEVICES = [
  { key: 'led_temp', name: 'LED_NHIET_DO', label: 'LED Nhiet do' },
  { key: 'led_humi', name: 'LED_DO_AM', label: 'LED Do am' },
  { key: 'led_bh', name: 'LED_ANH_SANG', label: 'LED Anh sang' },
  { key: 'led_led1', name: 'LED_1', label: 'LED 1' },
  { key: 'led_led2', name: 'LED_2', label: 'LED 2' },
] as const;

interface AggregatedRow extends RowDataPacket {
  day: string;
  device_name: string;
  on_count: number;
  off_count: number;
}

function normalizeDateInput(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildDateKeys(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const dateKeys: string[] = [];

  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dateKeys.push(formatDate(current));
  }

  return dateKeys;
}

function resolveRange(searchParams: URLSearchParams) {
  const mode = searchParams.get('mode') === 'date' ? 'date' : 'range';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (mode === 'date') {
    const selectedDate = normalizeDateInput(searchParams.get('date')) || formatDate(today);
    return {
      mode,
      days: 1,
      startDate: selectedDate,
      endDate: selectedDate,
      dateKeys: [selectedDate],
    };
  }

  const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') || '7', 10)));
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  const startDate = formatDate(start);
  const endDate = formatDate(today);

  return {
    mode,
    days,
    startDate,
    endDate,
    dateKeys: buildDateKeys(startDate, endDate),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { mode, days, startDate, endDate, dateKeys } = resolveRange(searchParams);

    const placeholders = DEVICES.map(() => '?').join(', ');
    const [rows] = await pool.query<AggregatedRow[]>(
      `
        SELECT
          DATE_FORMAT(report_date, '%Y-%m-%d') AS day,
          device_name,
          SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) AS on_count,
          SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) AS off_count
        FROM LICH_SU_HANH_DONG
        WHERE DATE(report_date) BETWEEN ? AND ?
          AND device_name IN (${placeholders})
          AND status IN ('online', 'offline')
        GROUP BY DATE_FORMAT(report_date, '%Y-%m-%d'), device_name
        ORDER BY day ASC, device_name ASC
      `,
      [startDate, endDate, ...DEVICES.map((device) => device.name)]
    );

    const rowsByDay = new Map<string, AggregatedRow[]>();
    for (const row of rows) {
      const dayRows = rowsByDay.get(row.day) || [];
      dayRows.push(row);
      rowsByDay.set(row.day, dayRows);
    }

    const summaries = DEVICES.map((device) => ({
      deviceKey: device.key,
      deviceName: device.name,
      label: device.label,
      onCount: 0,
      offCount: 0,
      totalCount: 0,
    }));

    const summaryMap = new Map<string, (typeof summaries)[number]>(
      summaries.map((summary) => [summary.deviceName, summary])
    );

    const daily = dateKeys.map((day) => {
      const dayRows = rowsByDay.get(day) || [];
      const entry: Record<string, string | number> = {
        day,
        totalOn: 0,
        totalOff: 0,
      };

      for (const device of DEVICES) {
        entry[`${device.key}On`] = 0;
        entry[`${device.key}Off`] = 0;
      }

      for (const row of dayRows) {
        const device = DEVICES.find((item) => item.name === row.device_name);
        if (!device) continue;

        const onCount = Number(row.on_count);
        const offCount = Number(row.off_count);

        entry[`${device.key}On`] = onCount;
        entry[`${device.key}Off`] = offCount;
        entry.totalOn = Number(entry.totalOn) + onCount;
        entry.totalOff = Number(entry.totalOff) + offCount;

        const summary = summaryMap.get(row.device_name);
        if (summary) {
          summary.onCount += onCount;
          summary.offCount += offCount;
          summary.totalCount += onCount + offCount;
        }
      }

      return entry;
    });

    return NextResponse.json({
      mode,
      range: {
        days,
        start: startDate,
        end: endDate,
      },
      devices: DEVICES,
      summaries,
      daily,
    });
  } catch (error) {
    console.error('Daily action stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily LED usage stats' }, { status: 500 });
  }
}
