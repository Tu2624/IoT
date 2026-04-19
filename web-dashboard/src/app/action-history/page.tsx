'use client';
import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/Card';
import moment from 'moment';
import { clsx } from 'clsx';
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface ActionRecord {
  report_id: number;
  device_name: string;
  status: string;
  description: string;
  report_date: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type SortKey = 'id' | 'device' | 'status' | 'trigger' | 'time';
type SortOrder = 'asc' | 'desc';

// Map sortKey frontend -> sortBy backend
function mapSortKey(key: SortKey): string {
  switch (key) {
    case 'id': return 'report_id';
    case 'device': return 'device_name';
    case 'status': return 'status';
    case 'trigger': return 'description';
    case 'time': return 'report_date';
    default: return 'report_date';
  }
}

// Chuẩn hóa tên thiết bị hiển thị
const DEVICE_DISPLAY_NAMES: Record<string, string> = {
  'LED_NHIET_DO': 'LED Nhiệt độ',
  'LED_DO_AM': 'LED Độ ẩm',
  'LED_ANH_SANG': 'LED Ánh sáng',
  'TAT_CA_LED': 'Tất cả LED',
  // Legacy names fallback
  'LED Nhiệt độ': 'LED Nhiệt độ',
  'LED Độ ẩm': 'LED Độ ẩm',
  'LED Ánh sáng': 'LED Ánh sáng',
  'Tất cả LED': 'Tất cả LED',
};

function formatDeviceName(deviceName: string, description: string): string {
  // Ưu tiên từ DEVICE_DISPLAY_NAMES
  if (DEVICE_DISPLAY_NAMES[deviceName]) return DEVICE_DISPLAY_NAMES[deviceName];
  // Fallback dựa vào description
  if (description?.includes('led_temp')) return 'LED Nhiệt độ';
  if (description?.includes('led_humi')) return 'LED Độ ẩm';
  if (description?.includes('led_bh')) return 'LED Ánh sáng';
  if (description?.includes('lights_all')) return 'Tất cả LED';
  return deviceName;
}

export default function ActionHistory() {
  const [data, setData] = useState<ActionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTime, setSearchTime] = useState('');
  const [combinedFilter, setCombinedFilter] = useState('all');

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
        params.set('searchTime', searchTime);
      }
      if (combinedFilter !== 'all') params.set('filter', combinedFilter);

      const res = await fetch(`/api/actions/list?${params.toString()}`);
      const json = await res.json();

      if (json.data && json.pagination) {
        setData(json.data);
        setPagination(json.pagination);
      } else if (Array.isArray(json)) {
        setData(json);
        setPagination({ page: 1, limit: 10, total: json.length, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchTime, combinedFilter, sortKey, sortOrder]);

  // Fetch khi thay đổi sort
  useEffect(() => {
    fetchData(pagination.page);
  }, [sortKey, sortOrder, combinedFilter]);

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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status: string) => {
    if (status?.toLowerCase() === 'online') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (status?.toLowerCase() === 'waiting') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

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
    const total = pagination.totalPages;
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
        <div>
          <h1 className="text-xl font-bold text-slate-100">Lịch sử Thao tác Thiết bị</h1>
          <div className="text-slate-400 text-sm">Hiển thị lịch sử publish/subscribe MQTT</div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 p-2"
            />
          </div>

          {/* Single Time Filter with Picker */}
          <div className="relative flex">
            <input
              type="text"
              placeholder="Tìm theo thời gian..."
              title="Tìm theo thời gian (Có thể dán)"
              value={searchTime}
              onChange={e => setSearchTime(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-l-lg focus:ring-blue-500 focus:border-blue-500 block w-[160px] p-2 placeholder:text-slate-500"
            />
            <div className="relative bg-slate-800 border border-l-0 border-slate-700 rounded-r-lg flex items-center justify-center px-3 hover:bg-slate-700 transition cursor-pointer" title="Chọn từ lịch">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="datetime-local"
                step="1"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={e => {
                  if (e.target.value) {
                    setSearchTime(moment(e.target.value).format('YYYY-MM-DD HH:mm:ss'));
                  }
                }}
              />
            </div>
          </div>

          {/* Combined Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={combinedFilter}
              onChange={e => setCombinedFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 p-2 appearance-none pr-8 cursor-pointer"
            >
              <option value="all">Mọi bộ lọc (Thiết bị & Trạng thái)</option>
              <option value="device_LED_NHIET_DO">LED Nhiệt độ</option>
              <option value="device_LED_DO_AM">LED Độ ẩm</option>
              <option value="device_LED_ANH_SANG">LED Ánh sáng</option>
              <option value="status_online">Online</option>
              <option value="status_offline">Offline</option>
              <option value="status_waiting">Waiting</option>
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
                {renderSortHeader("Tên thiết bị", "device")}
                {renderSortHeader("Trạng thái", "status")}
                {renderSortHeader("Mã lệnh", "trigger")}
                {renderSortHeader("Thời gian", "time")}
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                    Đang tải dữ liệu...
                  </div>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Không tìm thấy dữ liệu phù hợp.</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.report_id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400">#{row.report_id}</td>
                    <td className="py-3 px-4 text-slate-200 font-medium">{formatDeviceName(row.device_name, row.description)}</td>
                    <td className="py-3 px-4">
                      <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(row.status))}>
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-xs bg-slate-800 p-1 rounded max-w-max my-2">{row.description}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">{moment(row.report_date).format('YYYY-MM-DD HH:mm:ss')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between border-t border-slate-700/50 pt-4 gap-4">
            <span className="text-sm text-slate-400">
              Trang <span className="font-medium text-slate-200">{pagination.page}</span> / <span className="font-medium text-slate-200">{pagination.totalPages}</span> — Tổng <span className="font-medium text-slate-200">{pagination.total}</span> kết quả
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
                disabled={pagination.page === pagination.totalPages}
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
