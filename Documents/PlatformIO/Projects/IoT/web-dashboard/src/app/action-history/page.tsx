'use client';
import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import moment from 'moment';
import { clsx } from 'clsx';

interface ActionRecord {
  report_id: number;
  device_name: string;
  status: string;
  description: string;
  report_date: string;
}

export default function ActionHistory() {
  const [data, setData] = useState<ActionRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md">
        <h1 className="text-xl font-bold text-slate-100">Lịch sử Thao tác Thiết bị</h1>
        <div className="text-slate-400 text-sm">Hiển thị lịch sử publish/subscribe MQTT</div>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="pb-3 px-4 font-medium">ID</th>
                <th className="pb-3 px-4 font-medium">Tên thiết bị</th>
                <th className="pb-3 px-4 font-medium">Trạng thái/Hành động</th>
                <th className="pb-3 px-4 font-medium">Mã lệnh (Trigger)</th>
                <th className="pb-3 px-4 font-medium">Thời gian</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có lịch sử thao tác. Hãy gửi thử 1 lệnh điều khiển ở Dashboard.</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.report_id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400">#{row.report_id}</td>
                    <td className="py-3 px-4 text-slate-200 font-medium">{row.device_name}</td>
                    <td className="py-3 px-4">
                      <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(row.status))}>
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-xs bg-slate-800 p-1 rounded max-w-max my-2">{row.description}</td>
                    <td className="py-3 px-4 text-slate-300">{moment(row.report_date).format('HH:mm - DD/MM/YYYY')}</td>
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
