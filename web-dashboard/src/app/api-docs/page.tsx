'use client';

import Card from '@/components/Card';
import { Braces, Globe, Database, ArrowRight, Code2, AlertTriangle } from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  params?: { name: string; type: string; desc: string }[];
  response: string;
}

const endpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/sensors/recent',
    description: 'Truy xuất các giá trị cảm biến mới nhất từ cơ sở dữ liệu để cập nhật biểu đồ thời gian thực trên Dashboard.',
    response: `[
  {
    "history_id": 105,
    "temp": 28.4,
    "humi": 62.1,
    "lux": 350,
    "recorded_date": "2024-04-12T20:15:30Z"
  },
  {
    "history_id": 104,
    "temp": 28.5,
    "humi": 61.8,
    "lux": 355,
    "recorded_date": "2024-04-12T20:10:30Z"
  }
]`
  },
  {
    method: 'GET',
    path: '/api/sensors/list',
    description: 'Cung cấp danh sách lịch sử dữ liệu cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng) kèm theo các bộ lọc tìm kiếm và cơ chế phân trang.',
    params: [
      { name: 'page', type: 'number', desc: 'Chỉ số trang hiện tại (Mặc định: 1)' },
      { name: 'limit', type: 'number', desc: 'Số lượng bản ghi tối đa trên một truy vấn (Mặc định: 10)' },
      { name: 'search', type: 'string', desc: 'Tìm kiếm tương đối theo giá trị các cảm biến' }
    ],
    response: `{
  "data": [
    {
      "history_id": 99,
      "temp": 27.2,
      "humi": 55.0,
      "lux": 150,
      "recorded_date": "2024-04-12T19:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 540,
    "totalPages": 54
  }
}`
  },
  {
    method: 'GET',
    path: '/api/actions/list',
    description: 'Truy xuất nhật ký tương tác thiết bị (Audit Trail) - Ghi lại mọi hành động điều khiển phần cứng từ người dùng.',
    params: [
      { name: 'page', type: 'number', desc: 'Chỉ số trang cần truy xuất' },
      { name: 'filter', type: 'string', desc: 'Bộ lọc theo Mã thiết bị hoặc Trạng thái xác nhận' }
    ],
    response: `{
  "data": [
    {
      "report_id": 52,
      "device_name": "LED_NHIET_DO",
      "status": "online",
      "description": "Thực thi thành công: led_temp",
      "report_date": "2024-04-12T21:05:45Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 85,
    "totalPages": 9
  }
}`
  },
  {
    method: 'GET',
    path: '/api/status',
    description: 'Kiểm tra trạng thái vận hành logic hiện tại của các linh kiện đèn LED (On/Off) đã đồng bộ với phần cứng.',
    response: `{
  "status": {
    "led_temp": true,
    "led_humi": false,
    "led_bh": true,
    "led_led1": false,
    "led_led2": true
  }
}`
  }
];

export default function ApiDocs() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-10 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-2">
          <Globe className="w-4 h-4" />
          <span>v1.0.0 Stable</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          API <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Specification</span>
        </h1>
        <p className="text-slate-400 max-w-3xl mx-auto text-lg leading-relaxed">
          Tài liệu mô tả chi tiết các Giao diện lập trình ứng dụng (API) thuộc hệ thống IoT. Các API này tuân thủ kiến trúc RESTful, cung cấp nền tảng kết nối liền mạch giữa phần cứng và giao diện Dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {endpoints.map((api, index) => (
          <Card key={index} className="overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <div className="p-6 md:p-8">
              {/* Endpoint Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg font-bold text-xs tracking-widest ${
                    api.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {api.method}
                  </span>
                  <code className="text-lg font-mono text-slate-200">
                    {api.path}
                  </code>
                </div>
                <div className="flex items-center text-slate-500 text-sm italic">
                   <Database className="w-4 h-4 mr-2" />
                   MySQL Engine 8.0
                </div>
              </div>

              <p className="text-slate-300 mb-8 leading-relaxed font-medium">
                {api.description}
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Parameters Section */}
                <div>
                  <h4 className="flex items-center gap-2 text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                    <Braces className="w-4 h-4 text-blue-400" />
                    Tham số truy vấn (Query)
                  </h4>
                  {api.params ? (
                    <div className="space-y-3">
                      {api.params.map((param, pIdx) => (
                        <div key={pIdx} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-400 font-mono text-sm">{param.name}</span>
                            <span className="text-slate-600 text-[10px] uppercase font-bold tracking-tighter">{param.type}</span>
                          </div>
                          <p className="text-slate-500 text-xs">{param.desc}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-emerald-400 font-mono text-sm">Accept</span>
                          <span className="text-slate-600 text-[10px] uppercase font-bold tracking-tighter">Header</span>
                        </div>
                        <p className="text-slate-500 text-xs">application/json</p>
                      </div>
                      <p className="text-slate-600 text-[10px] italic text-center mt-2">Phương thức này chỉ yêu cầu Header mặc định</p>
                    </div>
                  )}
                </div>

                {/* Response Section */}
                <div>
                  <h4 className="flex items-center gap-2 text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    Cấu trúc phản hồi (JSON)
                  </h4>
                  <div className="relative">
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto shadow-inner leading-relaxed">
                      {api.response}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer Alert */}
      <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4 items-start max-w-3xl mx-auto">
        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <h5 className="text-amber-200 font-bold text-sm underline-offset-4 decoration-amber-500/30 underline">Lưu ý về Bảo mật hệ thống</h5>
          <p className="text-slate-400 text-xs leading-relaxed">
            Các điểm cuối (Endpoints) hiện hành đang được triển khai trên môi trường phát triển (Development). Ở phiên bản vận hành chính thức, mọi truy cập yêu cầu định danh qua tầng trung gian Bearer Token (JWT) để đảm bảo an toàn thông tin theo chuẩn công nghiệp.
          </p>
        </div>
      </div>
    </div>
  );
}
