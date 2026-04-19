'use client';
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import moment from 'moment';

interface LedsState {
  bh: boolean;
  temp: boolean;
  humi: boolean;
}

interface SensorData {
  time: string;
  temp: number;
  humi: number;
  lux: number;
}

interface DeviceContextType {
  leds: LedsState;
  mqttStatus: 'connected' | 'disconnected';
  espStatus: 'online' | 'offline';
  currentSensor: { temp: number; humi: number; lux: number };
  sensorHistory: SensorData[];
  toggleLed: (ledName: keyof LedsState) => void;
  ledsReady: boolean;
  alert: { message: string; type: 'error' | 'success' | null };
  clearAlert: () => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leds, setLeds] = useState<LedsState>({ bh: false, temp: false, humi: false });
  const [ledsReady, setLedsReady] = useState(false);
  const [mqttStatus, setMqttStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [espStatus, setEspStatus] = useState<'online' | 'offline'>('offline');
  const [currentSensor, setCurrentSensor] = useState({ temp: 0, humi: 0, lux: 0 });
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [alert, setAlert] = useState<{ message: string; type: 'error' | 'success' | null }>({ message: '', type: null });
  const pendingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const socketRef = useRef<Socket | null>(null);
  const MAX_CHART_POINTS = 5;

  useEffect(() => {
    let isMounted = true;

    const fetchInitialStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const json = await res.json();
        if (isMounted && json.status) {
          setLeds({
            temp: json.status.led_temp === true,
            humi: json.status.led_humi === true,
            bh: json.status.led_bh === true,
          });
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      } finally {
        if (isMounted) setLedsReady(true);
      }
    };

    fetchInitialStatus();

    fetch('/api/sensors/recent')
      .then(res => res.json())
      .then((rows: any[]) => {
        if (isMounted && Array.isArray(rows) && rows.length > 0) {
          const history = rows.map(r => ({
            time: moment(r.recorded_date).format('HH:mm:ss'),
            temp: r.temp,
            humi: r.humi,
            lux: r.lux,
          }));
          setSensorHistory(history);
          const latest = rows[rows.length - 1];
          setCurrentSensor({ temp: latest.temp, humi: latest.humi, lux: latest.lux });
        }
      })
      .catch(() => { });

    if (!socketRef.current) {
      socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || '', { path: '/socket.io' });

      socketRef.current.on('sensor_data', (payload: any) => {
        if (!isMounted) return;
        const newData: SensorData = {
          time: moment(payload.recorded_date).format('HH:mm:ss'),
          temp: payload.temp,
          humi: payload.humi,
          lux: payload.lux
        };

        setCurrentSensor({ temp: payload.temp, humi: payload.humi, lux: payload.lux });
        setSensorHistory((prev) => {
          const updated = [...prev, newData];
          if (updated.length > MAX_CHART_POINTS) updated.shift();
          return updated;
        });
      });

      socketRef.current.on('mqtt_status', (status: 'connected' | 'disconnected') => {
        if (isMounted) setMqttStatus(status);
      });

      socketRef.current.on('device_status', (payload: any) => {
        if (!isMounted) return;

        if (payload.status) {
          if (payload.trigger === 'heartbeat_timeout') {
            setEspStatus('offline');
            // Cố tình KHÔNG clear bộ đếm pendingTimeouts ở đây.
            // Để cho chúng tự động chạy hết 5s để trigger hàm hoàn tác (revert) nút bấm và hiện dòng thông báo!
          } else {
            setEspStatus('online');
            if (payload.trigger && pendingTimeouts.current[payload.trigger]) {
              console.log(`[SUCCESS] Command ${payload.trigger} confirmed.`);
              clearTimeout(pendingTimeouts.current[payload.trigger]);
              delete pendingTimeouts.current[payload.trigger];
            }
          }
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleLed = useCallback((ledName: keyof LedsState) => {
    if (espStatus === 'offline') {
      setAlert({ message: 'Thiết bị đang mất kết nối!', type: 'error' });
      return;
    }

    const prevState = leds[ledName];
    const newState = !prevState;

    setLeds(prev => ({ ...prev, [ledName]: newState }));

    if (socketRef.current) {
      socketRef.current.emit('control_device', {
        cmd: 'led',
        target: ledName,
        state: newState ? 1 : 0
      });
    }

    const timeoutKey = `led_${ledName}`;
    if (pendingTimeouts.current[timeoutKey]) {
      clearTimeout(pendingTimeouts.current[timeoutKey]);
    }

    pendingTimeouts.current[timeoutKey] = setTimeout(async () => {
      console.warn(`[TIMEOUT] No response for ${timeoutKey}. Reverting...`);
      setLeds(prev => ({ ...prev, [ledName]: prevState }));
      setAlert({ message: 'Không phản hồi', type: 'error' });
      
      try {
        await fetch('/api/actions/report-failure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_key: timeoutKey,
            status: 'error',
            description: 'Thiết bị không phản hồi lệnh điều khiển (Timeout 5s)'
          })
        });
      } catch (e) {
        console.error('Failed to log failure:', e);
      }

      delete pendingTimeouts.current[timeoutKey];
    }, 5000);
  }, [leds, espStatus]);

  const clearAlert = useCallback(() => {
    setAlert({ message: '', type: null });
  }, []);

  return (
    <DeviceContext.Provider value={{
      leds,
      mqttStatus,
      espStatus,
      currentSensor,
      sensorHistory,
      toggleLed,
      ledsReady,
      alert,
      clearAlert
    }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
