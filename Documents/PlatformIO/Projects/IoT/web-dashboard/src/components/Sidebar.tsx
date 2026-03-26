'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, History, User } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { name: 'DashBoard', href: '/', icon: LayoutDashboard },
  { name: 'DataSensor', href: '/data-sensor', icon: Database },
  { name: 'ActionHistory', href: '/action-history', icon: History },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700/50 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">IoT Sensor</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-blue-500/10 text-blue-400" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-300")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
