'use client';
import { useEffect, useState, useRef } from 'react';
import Card from '@/components/Card';
import { io, Socket } from 'socket.io-client';
import { Thermometer, Droplets, Sun, Power } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { clsx } from 'clsx';
import moment from 'moment';

interface SensorData {
  time: string;
  temp: number;
  humi: number;
  lux: number;
}

export default function Dashboard() {
  const [dataList, setDataList] = useState<SensorData[]>([]);
  const [current, setCurrent] = useState({ temp: 0, humi: 0, lux: 0 });
  const socketRef = useRef<Socket | null>(null);

  // States for small sensor toggles (True = reading enabled)
  const [sensorState, setSensorState] = useState({ temp: true, humi: true, lux: true });
  
  // States for big LED toggles
  const [leds, setLeds] = useState({ bh: false, dht: false, sys: false });

  useEffect(() => {
    // Only init socket once
    if (!socketRef.current) {
      socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || '', { path: '/socket.io' });
      
      socketRef.current.on('sensor_data', (payload: any) => {
        // payload = { id, temp, hum, lux, recorded_date }
        const newData: SensorData = {
          time: moment(payload.recorded_date).format('HH:mm:ss'),
          temp: payload.temp,
          humi: payload.hum,
          lux: payload.lux
        };
        
        setCurrent({ temp: payload.temp, humi: payload.hum, lux: payload.lux });

        setDataList((prev) => {
          const updated = [...prev, newData];
          if (updated.length > 50) updated.shift(); // Keep last 50
          return updated;
        });
      });

      socketRef.current.on('device_status', (payload: any) => {
        // Đồng bộ trạng thái từ ESP32 trả về nếu cần thiết
        console.log('Status from ESP32:', payload);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const toggleLed = (ledName: 'bh' | 'dht' | 'sys') => {
    const newState = !leds[ledName];
    setLeds(prev => ({ ...prev, [ledName]: newState }));
    
    // Gửi lệnh qua socket tới backend (rồi bắn MQTT esp32/control)
    const command = `led_${ledName}_${newState ? 'on' : 'off'}`;
    if (socketRef.current) {
      socketRef.current.emit('control_device', command);
    }
  };

  const toggleSensor = (sensorKey: 'temp' | 'humi' | 'lux') => {
    const newState = !sensorState[sensorKey];
    setSensorState(prev => ({ ...prev, [sensorKey]: newState }));
    
    const command = `${sensorKey}_${newState ? 'on' : 'off'}`;
    if (socketRef.current) {
      socketRef.current.emit('control_device', command);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md">
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Điều khiển thiết bị (LEDs)</h1>
        <div className="flex gap-6">
          <DeviceToggle color="red" label="LED Phát nhiệt" checked={leds.dht} onChange={() => toggleLed('dht')} />
          <DeviceToggle color="blue" label="LED Hệ thống" checked={leds.sys} onChange={() => toggleLed('sys')} />
          <DeviceToggle color="yellow" label="LED Ánh sáng" checked={leds.bh} onChange={() => toggleLed('bh')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Nhiệt độ */}
        <Card glowColor={current.temp > 35 ? "red" : "none"} className="p-6 relative overflow-hidden group">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={() => toggleSensor('temp')}
              className={clsx("p-1.5 rounded-full transition-colors", sensorState.temp ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-500")}
              title="Bật/tắt đọc cảm biến nhiệt độ"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4 relative z-0">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Thermometer className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Temperature</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold text-slate-100">{sensorState.temp ? current.temp.toFixed(1) : '--'}</h3>
                <span className="text-red-400 text-sm font-semibold">°C</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card Độ ẩm */}
        <Card glowColor={current.humi < 40 ? "blue" : "none"} className="p-6 relative overflow-hidden group">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={() => toggleSensor('humi')}
              className={clsx("p-1.5 rounded-full transition-colors", sensorState.humi ? "bg-blue-500/20 text-blue-400" : "bg-slate-700 text-slate-500")}
              title="Bật/tắt đọc cảm biến độ ẩm"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4 relative z-0">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Humidity</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold text-slate-100">{sensorState.humi ? current.humi.toFixed(1) : '--'}</h3>
                <span className="text-blue-400 text-sm font-semibold">%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card Ánh sáng */}
        <Card glowColor={current.lux > 800 ? "yellow" : "none"} className="p-6 relative overflow-hidden group">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={() => toggleSensor('lux')}
              className={clsx("p-1.5 rounded-full transition-colors", sensorState.lux ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-700 text-slate-500")}
              title="Bật/tắt đọc cảm biến ánh sáng"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4 relative z-0">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Sun className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Light</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold text-slate-100">{sensorState.lux ? current.lux.toFixed(0) : '--'}</h3>
                <span className="text-yellow-500 text-sm font-semibold">Lx</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 min-h-[400px]">
        <h3 className="text-lg font-semibold mb-6 text-slate-200">Biểu đồ Thông số Thời gian thực</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataList} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} minTickGap={20} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="temp" name="Nhiệt độ (°C)" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="humi" name="Độ ẩm (%)" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="lux" name="Ánh sáng (Lx)" stroke="#eab308" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// Sub-component cho Công tắc bóp méo
function DeviceToggle({ color, label, checked, onChange }: { color: 'red' | 'blue' | 'yellow', label: string, checked: boolean, onChange: () => void }) {
  const colorMap = {
    red: "peer-checked:bg-red-500 peer-focus:ring-red-500/30",
    blue: "peer-checked:bg-blue-500 peer-focus:ring-blue-500/30",
    yellow: "peer-checked:bg-yellow-500 peer-focus:ring-yellow-500/30"
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className={clsx(
          "w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 rounded-full peer transition-all duration-300",
          "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white",
          colorMap[color]
        )}></div>
      </label>
      <span className="text-xs font-medium text-slate-400">{label}</span>
    </div>
  );
}
