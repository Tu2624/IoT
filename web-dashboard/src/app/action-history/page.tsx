'use client';
import { useEffect, useState, useMemo } from 'react';
import Card from '@/components/Card';
import moment from 'moment';
import { clsx } from 'clsx';
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface ActionRecord {
  report_id: number;
  device_name: string;
  status: string;
  description: string;
  report_date: string;
}

type SortKey = 'id' | 'device' | 'status' | 'trigger' | 'time';
type SortOrder = 'asc' | 'desc';

export default function ActionHistory() {
  const [data, setData] = useState<ActionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTime, setSearchTime] = useState(''); // exactly selected time
  const [combinedFilter, setCombinedFilter] = useState('all');
  
  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch('/api/actions/list')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);



  const getStatusColor = (status: string) => {
    if (status?.toLowerCase() === 'online') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (status?.toLowerCase() === 'waiting') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const formatDeviceName = (deviceName: string, description: string) => {
    if (description?.includes('led_temp')) return 'LED Nhiệt độ';
    if (description?.includes('led_humi')) return 'LED Độ ẩm';
    if (description?.includes('led_bh')) return 'LED Ánh sáng';
    if (description?.includes('lights_all')) return 'Tất cả LED';
    return deviceName;
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc'); // Default to desc when changing columns
    }
  };

  const filteredAndSortedData = useMemo(() => {
    // Filter
    let processed = data.filter(row => {
      const formattedTime = moment(row.report_date).format('HH:mm - DD/MM/YYYY');
      const rowMoment = moment(row.report_date);
      const q = searchQuery.toLowerCase();
      const displayName = formatDeviceName(row.device_name, row.description);
      
      const matchesSearch = 
          row.report_id.toString().includes(q) ||
          displayName.toLowerCase().includes(q) ||
          row.status.toLowerCase().includes(q) ||
          row.description.toLowerCase().includes(q) ||
          formattedTime.toLowerCase().includes(q);

      let matchesTime = true;
      if (searchTime !== '') {
        // Chỉ so sánh đến cấp độ phút (cùng ngày, giờ, phút)
        matchesTime = rowMoment.format('YYYY-MM-DD HH:mm') === moment(searchTime).format('YYYY-MM-DD HH:mm');
      }
      
      let matchesCombined = true;
      if (combinedFilter !== 'all') {
        if (combinedFilter.startsWith('device_')) {
          const expectedDevice = combinedFilter.replace('device_', '');
          matchesCombined = displayName === expectedDevice;
        } else if (combinedFilter.startsWith('status_')) {
          const expectedStatus = combinedFilter.replace('status_', '');
          matchesCombined = row.status?.toLowerCase() === expectedStatus.toLowerCase();
        }
      }
      
      return matchesSearch && matchesTime && matchesCombined;
    });

    // Sort
    processed.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortKey === 'id') { aVal = a.report_id; bVal = b.report_id; }
      else if (sortKey === 'device') { aVal = formatDeviceName(a.device_name, a.description); bVal = formatDeviceName(b.device_name, b.description); }
      else if (sortKey === 'status') { aVal = a.status; bVal = b.status; }
      else if (sortKey === 'trigger') { aVal = a.description; bVal = b.description; }
      else if (sortKey === 'time') { aVal = new Date(a.report_date).getTime(); bVal = new Date(b.report_date).getTime(); }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return processed;
  }, [data, searchQuery, searchTime, combinedFilter, sortKey, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);

  const currentData = filteredAndSortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

  // Trích xuất filter dropdown
  const uniqueDevices = useMemo(() => {
    const devices = Array.from(new Set(data.map(d => formatDeviceName(d.device_name, d.description))));
    // Chỉ giữ lại tên từng LED cụ thể
    return devices.filter(d => d === 'LED Nhiệt độ' || d === 'LED Độ ẩm' || d === 'LED Ánh sáng');
  }, [data]);

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
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 p-2"
            />
          </div>

          {/* Single Time Filter */}
          <div className="relative">
            <input
              type="datetime-local"
              title="Chọn thời gian chính xác"
              value={searchTime}
              onChange={e => { setSearchTime(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 placeholder:text-slate-500"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={combinedFilter}
              onChange={e => { setCombinedFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 p-2 appearance-none pr-8 cursor-pointer"
            >
              <option value="all">Mọi bộ lọc (Thiết bị & Trạng thái)</option>
              {uniqueDevices.map(d => (
                <option key={`device_${d}`} value={`device_${d}`}>{d}</option>
              ))}
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
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : currentData.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Không tìm thấy dữ liệu phù hợp.</td></tr>
              ) : (
                currentData.map(row => (
                  <tr key={row.report_id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400">#{row.report_id}</td>
                    <td className="py-3 px-4 text-slate-200 font-medium">{formatDeviceName(row.device_name, row.description)}</td>
                    <td className="py-3 px-4">
                      <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(row.status))}>
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-xs bg-slate-800 p-1 rounded max-w-max my-2">{row.description}</td>
                    <td className="py-3 px-4 text-slate-300">{moment(row.report_date).format('HH:mm:ss - DD/MM/YYYY')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between border-t border-slate-700/50 pt-4 gap-4">
            <span className="text-sm text-slate-400">
              Hiển thị <span className="font-medium text-slate-200">{filteredAndSortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> đến <span className="font-medium text-slate-200">{Math.min(currentPage * pageSize, filteredAndSortedData.length)}</span> trong số <span className="font-medium text-slate-200">{filteredAndSortedData.length}</span> kết quả
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, i, arr) => (
                    <div key={p} className="flex items-center">
                      {i > 0 && p - arr[i - 1] > 1 && <span className="px-2 text-slate-500">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                          p === currentPage 
                            ? "bg-slate-700 text-white border border-slate-600" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                      >
                        {p}
                      </button>
                    </div>
                  ))
                }
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
