'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, History, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import Image from 'next/image';
import profileImg from '../app/profile/profileImg.png';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'DataSensor', href: '/data-sensor', icon: Database },
  { name: 'LedUsage', href: '/led-usage', icon: BarChart3 },
  { name: 'ActionHistory', href: '/action-history', icon: History },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-50 shadow-2xl">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden md:block">
          IoT Sensor
        </span>
      </div>

      {/* Center: Navigation Groups */}
      <nav className="flex items-center gap-2 bg-slate-800/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-5 py-2 rounded-xl transition-all duration-300 text-sm font-semibold whitespace-nowrap",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
              )}
            >
              <Icon className={clsx("w-4.5 h-4.5", isActive ? "text-white" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-6">
        <Link href="/profile" className={clsx(
          "flex items-center gap-3 pl-6 border-l border-white/10 group transition-all",
          pathname === '/profile' ? "text-blue-400" : "text-slate-300 hover:text-white"
        )}>
          <div className="text-right hidden xl:block">
            <p className="text-sm font-bold tracking-tight">Vũ Đình Tú</p>
            <p className="text-[10px] text-slate-500 font-medium">B22DCPT244</p>
          </div>
          <div className={clsx(
            "w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 overflow-hidden",
            pathname === '/profile' ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-800 group-hover:border-slate-500"
          )}>
            <Image 
              src={profileImg} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
        </Link>
      </div>
    </header>
  );
}
