'use client';
import { useEffect, useState, useMemo } from 'react';
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

type SortKey = 'id' | 'name' | 'value' | 'time';
type SortOrder = 'asc' | 'desc';

export default function DataSensor() {
  const [data, setData] = useState<SensorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTime, setSearchTime] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  
  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch('/api/sensors/list')
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) {
          setData(json);
        } else {
          console.error('Expected array from API but got:', json);
          setData([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const flattenedData = useMemo(() => {
    let index = 1;
    const flat: FlatSensorRecord[] = [];
    data.forEach(row => {
      flat.push({
        id: index.toString().padStart(2, '0'),
        history_id: row.history_id,
        sensor_name: 'Cảm biến nhiệt độ',
        valueStr: `${Number(row.temp).toFixed(0)}°C`,
        rawValue: row.temp,
        type: 'temp',
        recorded_date: row.recorded_date
      });
      index++;
      flat.push({
        id: index.toString().padStart(2, '0'),
        history_id: row.history_id,
        sensor_name: 'Cảm biến độ ẩm',
        valueStr: `${Number(row.humi).toFixed(0)}%`,
        rawValue: row.humi,
        type: 'humi',
        recorded_date: row.recorded_date
      });
      index++;
      flat.push({
        id: index.toString().padStart(2, '0'),
        history_id: row.history_id,
        sensor_name: 'Cảm biến ánh sáng',
        valueStr: `${Number(row.lux).toFixed(0)}Lx`,
        rawValue: row.lux,
        type: 'lux',
        recorded_date: row.recorded_date
      });
      index++;
    });
    return flat;
  }, [data]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    // 1. Text Search & Time Filter
    let processed = flattenedData.filter(row => {
      const formattedTime = moment(row.recorded_date).format('HH:mm-DD/MM/YYYY');
      const rowMoment = moment(row.recorded_date);
      const q = searchQuery.toLowerCase();
      
      let matchesSearch = true;
      if (q !== '') {
        matchesSearch = (
          row.id.includes(q) ||
          row.sensor_name.toLowerCase().includes(q) ||
          row.valueStr.toLowerCase().includes(q)
        );
      }

      let matchesTime = true;
      if (searchTime !== '') {
        matchesTime = rowMoment.format('YYYY-MM-DD HH:mm') === moment(searchTime).format('YYYY-MM-DD HH:mm');
      }

      // 2. Sensor Filter
      let matchesQuick = true;
      if (quickFilter !== 'all') {
        matchesQuick = row.type === quickFilter;
      }
      
      return matchesSearch && matchesTime && matchesQuick;
    });

    // 3. Sort
    processed.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortKey === 'id') { aVal = parseInt(a.id, 10); bVal = parseInt(b.id, 10); }
      else if (sortKey === 'name') { aVal = a.sensor_name; bVal = b.sensor_name; }
      else if (sortKey === 'value') { aVal = a.rawValue; bVal = b.rawValue; }
      else if (sortKey === 'time') { aVal = new Date(a.recorded_date).getTime(); bVal = new Date(b.recorded_date).getTime(); }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return processed;
  }, [flattenedData, searchQuery, searchTime, quickFilter, sortKey, sortOrder]);

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
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[200px] pl-9 p-2 transition-all placeholder:text-slate-500 focus:w-[240px]"
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

          {/* Sensor Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
            <select
              title="Lọc theo cảm biến"
              value={quickFilter}
              onChange={e => { setQuickFilter(e.target.value); setCurrentPage(1); }}
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
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : currentData.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Không tìm thấy dữ liệu phù hợp.</td></tr>
              ) : (
                currentData.map(row => (
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
