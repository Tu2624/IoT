'use client';
import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/Card';
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';
import { clsx } from 'clsx';

interface SensorRecord {
  history_id: number;
  temp: number;
  humi: number;
  lux: number;
  recorded_date: string;
}

interface FlatSensorRecord {
  id: string;
  history_id: number;
  sensor_name: string;
  valueStr: string;
  rawValue: number;
  type: string;
  recorded_date: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type SortKey = 'id' | 'name' | 'value' | 'time';
type SortOrder = 'asc' | 'desc';

// Map sortKey frontend -> sortBy backend
function mapSortKey(key: SortKey): string {
  switch (key) {
    case 'id': return 'history_id';
    case 'time': return 'recorded_date';
    case 'value': return 'temp'; // sort by temp by default when sorting by value
    case 'name': return 'recorded_date';
    default: return 'recorded_date';
  }
}

export default function DataSensor() {
  const [data, setData] = useState<SensorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTime, setSearchTime] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Debounce timer
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: mapSortKey(sortKey),
        sortOrder: sortOrder.toUpperCase(),
      });

      if (searchQuery) params.set('search', searchQuery);
      if (searchTime) {
        // Chuyển datetime-local sang format YYYY-MM-DD HH:mm
        const formatted = moment(searchTime).format('YYYY-MM-DD HH:mm');
        params.set('searchTime', formatted);
      }

      const res = await fetch(`/api/sensors/list?${params.toString()}`);
      const json = await res.json();

      if (json.data && json.pagination) {
        setData(json.data);
        setPagination(json.pagination);
      } else if (Array.isArray(json)) {
        // Fallback cho API cũ
        setData(json);
        setPagination({ page: 1, limit: 10, total: json.length, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchTime, sortKey, sortOrder]);

  // Fetch khi thay đổi page, sort, filter
  useEffect(() => {
    fetchData(pagination.page);
  }, [sortKey, sortOrder]);

  // Debounce search
  useEffect(() => {
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      fetchData(1);
    }, 400);
    setSearchTimer(timer);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchTime]);

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page }));
    fetchData(page);
  };

  // Flatten data cho hiển thị bảng (chia mỗi record ra 3 dòng sensor)
  const flattenedData: FlatSensorRecord[] = [];
  let index = (pagination.page - 1) * pagination.limit * 3 + 1;

  data.forEach(row => {
    if (quickFilter === 'all' || quickFilter === 'temp') {
      flattenedData.push({
        id: index.toString().padStart(2, '0'),
        history_id: row.history_id,
        sensor_name: 'Cảm biến nhiệt độ',
        valueStr: `${Number(row.temp).toFixed(0)}°C`,
        rawValue: row.temp,
        type: 'temp',
        recorded_date: row.recorded_date
      });
      index++;
    }
    if (quickFilter === 'all' || quickFilter === 'humi') {
      flattenedData.push({
        id: index.toString().padStart(2, '0'),
        history_id: row.history_id,
        sensor_name: 'Cảm biến độ ẩm',
        valueStr: `${Number(row.humi).toFixed(0)}%`,
        rawValue: row.humi,
        type: 'humi',
        recorded_date: row.recorded_date
      });
      index++;
    }
    if (quickFilter === 'all' || quickFilter === 'lux') {
      flattenedData.push({
        id: index.toString().padStart(2, '0'),
        history_id: row.history_id,
        sensor_name: 'Cảm biến ánh sáng',
        valueStr: `${Number(row.lux).toFixed(0)}Lx`,
        rawValue: row.lux,
        type: 'lux',
        recorded_date: row.recorded_date
      });
      index++;
    }
  });

  // Sort locally for name/value columns (since backend sorts by DB columns)
  if (sortKey === 'name' || sortKey === 'value') {
    flattenedData.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortKey === 'name') { aVal = a.sensor_name; bVal = b.sensor_name; }
      else { aVal = a.rawValue; bVal = b.rawValue; }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // Tính tổng bản ghi hiển thị (mỗi sensor record tạo ra 3 dòng, hoặc 1 nếu đang filter)
  const multiplier = quickFilter === 'all' ? 3 : 1;
  const displayTotal = pagination.total * multiplier;
  const displayTotalPages = pagination.totalPages;

  const renderSortHeader = (label: string, key: SortKey) => (
    <th
      key={key}
      className="pb-3 px-4 font-medium cursor-pointer hover:text-slate-200 transition-colors group select-none"
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center gap-1">
        {label}
        <div className="flex flex-col opacity-50 group-hover:opacity-100">
          <ChevronUp className={clsx("w-3 h-3 -mb-1", sortKey === key && sortOrder === 'asc' ? "text-emerald-400" : "text-slate-500")} />
          <ChevronDown className={clsx("w-3 h-3", sortKey === key && sortOrder === 'desc' ? "text-emerald-400" : "text-slate-500")} />
        </div>
      </div>
    </th>
  );

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const total = displayTotalPages;
    const current = pagination.page;

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md gap-4">
        <h1 className="text-xl font-bold text-slate-100">Dữ liệu Cảm biến</h1>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[200px] pl-9 p-2 transition-all placeholder:text-slate-500 focus:w-[240px]"
            />
          </div>

          {/* Single Time Filter */}
          <div className="relative">
            <input
              type="datetime-local"
              title="Chọn thời gian chính xác"
              value={searchTime}
              onChange={e => setSearchTime(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 placeholder:text-slate-500"
            />
          </div>

          {/* Sensor Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
            <select
              title="Lọc theo cảm biến"
              value={quickFilter}
              onChange={e => setQuickFilter(e.target.value)}
              className="bg-slate-900 border border-blue-500/30 text-blue-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 p-2 appearance-none pr-8 cursor-pointer"
            >
              <option value="all">Hiển thị Tất cả</option>
              <option value="temp">Cảm biến nhiệt độ</option>
              <option value="humi">Cảm biến độ ẩm</option>
              <option value="lux">Cảm biến ánh sáng</option>
            </select>
          </div>

        </div>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                {renderSortHeader("ID", "id")}
                {renderSortHeader("Tên cảm biến", "name")}
                {renderSortHeader("Giá trị", "value")}
                {renderSortHeader("Thời gian", "time")}
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                    Đang tải dữ liệu...
                  </div>
                </td></tr>
              ) : flattenedData.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Không tìm thấy dữ liệu phù hợp.</td></tr>
              ) : (
                flattenedData.map(row => (
                  <tr key={`${row.history_id}-${row.type}`} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400">{row.id}</td>
                    <td className="py-3 px-4 text-slate-200">{row.sensor_name}</td>
                    <td className="py-3 px-4 font-medium">{row.valueStr}</td>
                    <td className="py-3 px-4 text-slate-300">{moment(row.recorded_date).format('HH:mm-DD/MM/YYYY')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && displayTotalPages > 1 && (
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between border-t border-slate-700/50 pt-4 gap-4">
            <span className="text-sm text-slate-400">
              Trang <span className="font-medium text-slate-200">{pagination.page}</span> / <span className="font-medium text-slate-200">{displayTotalPages}</span> — Tổng <span className="font-medium text-slate-200">{displayTotal}</span> kết quả
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => goToPage(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((p, i) => (
                  <div key={i} className="flex items-center">
                    {p === '...' ? (
                      <span className="px-2 text-slate-500">...</span>
                    ) : (
                      <button
                        onClick={() => goToPage(p as number)}
                        className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                          p === pagination.page
                            ? "bg-slate-700 text-white border border-slate-600"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                      >
                        {p}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                disabled={pagination.page === displayTotalPages}
                onClick={() => goToPage(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Trang tiếp theo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
