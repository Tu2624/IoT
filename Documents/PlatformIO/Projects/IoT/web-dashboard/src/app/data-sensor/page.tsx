'use client';
import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import { Download } from 'lucide-react';
import moment from 'moment';

interface SensorRecord {
  history_id: number;
  temp: number;
  humi: number;
  lux: number;
  recorded_date: string;
}

export default function DataSensor() {
  const [data, setData] = useState<SensorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sensors/list')
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

  const exportToExcel = () => {
    const csvRows = [
      ['ID', 'Nhiệt độ (°C)', 'Độ ẩm (%)', 'Ánh sáng (Lx)', 'Thời gian'],
      ...data.map(row => [
        row.history_id, 
        row.temp, 
        row.humi, 
        row.lux, 
        moment(row.recorded_date).format('HH:mm - DD/MM/YYYY')
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sensor_data.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md">
        <h1 className="text-xl font-bold text-slate-100">Dữ liệu Cảm biến</h1>
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
        >
          <Download className="w-4 h-4" />
          Xuất Excel
        </button>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="pb-3 px-4 font-medium">ID</th>
                <th className="pb-3 px-4 font-medium">Nhiệt độ (°C)</th>
                <th className="pb-3 px-4 font-medium">Độ ẩm (%)</th>
                <th className="pb-3 px-4 font-medium">Ánh sáng (Lx)</th>
                <th className="pb-3 px-4 font-medium">Thời gian</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có dữ liệu. Hãy khởi động ESP32.</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.history_id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400">#{row.history_id}</td>
                    <td className="py-3 px-4 text-red-300">{Number(row.temp).toFixed(1)}</td>
                    <td className="py-3 px-4 text-blue-300">{Number(row.humi).toFixed(1)}</td>
                    <td className="py-3 px-4 text-yellow-300">{Number(row.lux).toFixed(0)}</td>
                    <td className="py-3 px-4 text-slate-300">{moment(row.recorded_date).format('HH:mm - DD/MM/YYYY')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
