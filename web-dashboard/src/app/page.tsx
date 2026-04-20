'use client';
import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Card';
import { Thermometer, Droplets, Sun } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { clsx } from 'clsx';
import { useDevice } from '@/context/DeviceContext';

export default function Dashboard() {
  const {
    leds,
    mqttStatus,
    espStatus,
    currentSensor,
    sensorHistory,
    toggleLed,
    ledsReady,
    alert,
    clearAlert
  } = useDevice();

  useEffect(() => {
    if (alert && alert.message) {
      const timer = setTimeout(() => clearAlert(), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert, clearAlert]);

  const [mounted, setMounted] = useState(false);

  const fireParticles = useMemo(() => Array.from({ length: 6 }, () => ({
    left: `${Math.random() * 80 + 10}%`,
    delay: `${Math.random() * 3}s`,
  })), []);

  const waterDrops = useMemo(() => Array.from({ length: 8 }, () => ({
    left: `${Math.random() * 90 + 5}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${1.5 + Math.random()}s`,
  })), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeLeds = leds;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 bg-slate-800/50 p-4 px-6 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-lg h-fit">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-sm font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase tracking-wider whitespace-nowrap">Trang thai he thong</h1>
            <div className="flex gap-2">
              <span className={clsx("flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md border",
                mqttStatus === 'connected' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                <div className={clsx("w-1 h-1 rounded-full animate-pulse", mqttStatus === 'connected' ? "bg-emerald-400" : "bg-rose-400")}></div>
                MQTT
              </span>
              <span className={clsx("flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md border",
                espStatus === 'online' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                <div className={clsx("w-1 h-1 rounded-full animate-pulse", espStatus === 'online' ? "bg-emerald-400" : "bg-rose-400")}></div>
                ESP32
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center mr-[220px]">
          <div className={clsx(
            "flex items-center gap-8 bg-slate-900/60 p-4 px-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl transition-all duration-300 flex-wrap justify-center",
            !ledsReady && "opacity-50 pointer-events-none"
          )}>
            <DeviceToggle color="red" label="Nhiet do" checked={safeLeds.temp} onChange={() => toggleLed('temp')} />
            <DeviceToggle color="blue" label="Do am" checked={safeLeds.humi} onChange={() => toggleLed('humi')} />
            <DeviceToggle color="yellow" label="Anh sang" checked={safeLeds.bh} onChange={() => toggleLed('bh')} />
            <DeviceToggle color="green" label="LED 1" checked={safeLeds.led1} onChange={() => toggleLed('led1')} />
            <DeviceToggle color="violet" label="LED 2" checked={safeLeds.led2} onChange={() => toggleLed('led2')} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glowColor="red" className="p-6 relative overflow-hidden group">
          <div className="sensor-card-animation fire-effect">
            {mounted && fireParticles.map((p, i) => (
              <div key={i} className="fire-particle" style={{ left: p.left, animationDelay: p.delay }}></div>
            ))}
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Thermometer className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Temperature</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold text-slate-100">{currentSensor.temp.toFixed(1)}</h3>
                <span className="text-red-400 text-sm font-semibold">C</span>
              </div>
            </div>
          </div>
        </Card>

        <Card glowColor="blue" className="p-6 relative overflow-hidden group">
          <div className="sensor-card-animation water-effect">
            {mounted && waterDrops.map((p, i) => (
              <div key={i} className="water-drop" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }}></div>
            ))}
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Humidity</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold text-slate-100">{currentSensor.humi.toFixed(1)}</h3>
                <span className="text-blue-400 text-sm font-semibold">%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card glowColor="yellow" className="p-6 relative overflow-hidden group">
          <div className="pulse-glow glow-yellow"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Sun className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Light</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold text-slate-100">{currentSensor.lux.toFixed(0)}</h3>
                <span className="text-yellow-500 text-sm font-semibold">Lx</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 min-h-[400px]">
        <h3 className="text-lg font-semibold mb-6 text-slate-200">Bieu do thong so thoi gian thuc</h3>
        <div className="h-[350px] w-full min-h-[350px]">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%" minHeight={350} minWidth={100}>
              <LineChart data={sensorHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} minTickGap={20} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="temp" name="Nhiet do (C)" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="humi" name="Do am (%)" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="lux" name="Anh sang (Lx)" stroke="#eab308" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {alert && alert.message && (
        <div className={clsx(
          "fixed top-24 right-6 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md z-50 flex items-center gap-3 transition-all duration-300 animate-in slide-in-from-right-8",
          alert.type === 'error' ? "bg-rose-900/90 border-rose-500/50 text-rose-200" : "bg-emerald-900/90 border-emerald-500/50 text-emerald-200"
        )}>
          <div className={clsx("w-2 h-2 rounded-full animate-pulse", alert.type === 'error' ? "bg-rose-400" : "bg-emerald-400")} />
          <span className="font-medium text-sm drop-shadow-sm">{alert.message}</span>
          <button onClick={clearAlert} className="ml-2 text-white/50 hover:text-white pb-0.5 transition-colors">x</button>
        </div>
      )}
    </div>
  );
}

function DeviceToggle({ color, label, checked, onChange }: { color: 'red' | 'blue' | 'yellow' | 'green' | 'violet', label: string, checked: boolean, onChange: () => void }) {
  const config = {
    red: { bg: 'bg-[#FF0000]', icon: <Thermometer className="w-5 h-5 text-white stroke-[2.5]" /> },
    blue: { bg: 'bg-[#0088FF]', icon: <Droplets className="w-5 h-5 text-white" fill="white" /> },
    yellow: { bg: 'bg-[#FFAA00]', icon: <Sun className="w-5 h-5 text-white stroke-[2.5]" /> },
    green: { bg: 'bg-[#16A34A]', icon: <span className="text-sm font-black text-white">1</span> },
    violet: { bg: 'bg-[#7C3AED]', icon: <span className="text-sm font-black text-white">2</span> }
  };

  const { bg, icon } = config[color];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={clsx("flex items-center gap-2 p-1.5 pr-2 rounded-2xl shadow-lg transition-all duration-500",
        checked ? bg : "bg-slate-900/90 border border-white/5")}>
        <div className="flex items-center justify-center w-8 h-8">
          {icon}
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
          <div className={clsx(
            "w-16 h-9 rounded-full relative transition-all duration-500 shadow-inner overflow-hidden border-2 border-black/5",
            checked ? "bg-[#FFD233]" : "bg-gradient-to-br from-blue-900 to-slate-900"
          )}>
            {!checked && (
              <>
                <div className="absolute top-2 left-4 w-0.5 h-0.5 bg-white rounded-full animate-pulse"></div>
                <div className="absolute top-5 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce delay-100"></div>
                <div className="absolute top-2 left-10 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse delay-300"></div>
              </>
            )}

            <div className={clsx(
              "absolute top-2 w-5 h-5 rounded-full blur-[2px] transition-all duration-500",
              checked ? "bg-[#FF9900] left-[18px]" : "bg-blue-400/20 left-[36px]"
            )}></div>

            <div className={clsx(
              "absolute top-[2px] w-[30px] h-[30px] rounded-full shadow-md transition-all duration-500 flex items-center justify-center overflow-hidden z-10",
              checked ? "bg-[#E2EFFF] left-[30px]" : "bg-white left-[2px]"
            )}>
              {checked ? (
                <>
                  <div className="w-1.5 h-1.5 bg-[#BEDAFF] rounded-full absolute top-1.5 left-1.5"></div>
                  <div className="w-3 h-3 bg-[#BEDAFF] rounded-full absolute bottom-1 left-3.5"></div>
                  <div className="w-1.5 h-1.5 bg-[#BEDAFF] rounded-full absolute top-2.5 right-2"></div>
                </>
              ) : (
                <div className="w-full h-full bg-slate-100 opacity-20"></div>
              )}
            </div>
          </div>
        </label>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}
