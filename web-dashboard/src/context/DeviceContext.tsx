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
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mặc định khởi tạo là false (Tắt) để chờ dữ liệu thực từ DB
  const [leds, setLeds] = useState<LedsState>({ bh: false, temp: false, humi: false });
  const [ledsReady, setLedsReady] = useState(false);
  const [mqttStatus, setMqttStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [espStatus, setEspStatus] = useState<'online' | 'offline'>('offline');
  const [currentSensor, setCurrentSensor] = useState({ temp: 0, humi: 0, lux: 0 });
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const MAX_CHART_POINTS = 5;

  // === Khởi tạo Socket và Fetch trạng thái ban đầu ===
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch trạng thái từ DB để đồng bộ
    const fetchInitialStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const json = await res.json();
        if (isMounted && json.status) {
          setLeds({
            temp: json.status.led_temp ?? true,
            humi: json.status.led_humi ?? true,
            bh: json.status.led_bh ?? true,
          });
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      } finally {
        if (isMounted) setLedsReady(true);
      }
    };

    fetchInitialStatus();

    // 2. Fetch dữ liệu biểu đồ
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

    // 3. Init Socket
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
          } else {
            setEspStatus('online');
          }
        }
        // Gỡ bỏ phần tự động cập nhật leds từ payload.trigger để tránh xung đột thao tác
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleLed = useCallback((ledName: keyof LedsState) => {
    // Tính toán trạng thái mới dựa trên trạng thái hiện tại (Ref hoặc State)
    setLeds(prev => {
      const newState = !prev[ledName];

      // DI CHUYỂN VIỆC GỬI LỆNH RA KHỎI ĐÂY LÀ TỐT NHẤT, NHƯNG NẾU DÙNG UPDATER THÌ PHẢI CẨN THẬN
      // Để triệt để, chúng ta sẽ gọi emit sau khi setLeds (trong một function độc lập)
      return { ...prev, [ledName]: newState };
    });

    // LẤY TRẠNG THÁI HIỆN TẠI ĐỂ ĐẢO (Vì toggleLed sẽ được gọi lại khi leds thay đổi)
    const newState = !leds[ledName];
    if (socketRef.current) {
      socketRef.current.emit('control_device', {
        cmd: 'led',
        target: ledName,
        state: newState ? 1 : 0
      });
    }
  }, [leds]); // Thêm leds vào dependency để lấy giá trị mới nhất

  return (
    <DeviceContext.Provider value={{
      leds,
      mqttStatus,
      espStatus,
      currentSensor,
      sensorHistory,
      toggleLed,
      ledsReady
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
