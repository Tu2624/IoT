import { Bell, Search, UserCircle } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center opacity-0 md:opacity-100">
         {/* Giữ khoảng trống hoặc breadcrumbs nếu cần */}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-slate-800/50 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all focus:bg-slate-800"
          />
        </div>
        
        <button className="p-2 text-slate-400 hover:text-slate-200 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-200">Vũ Đình Tú</p>
            <p className="text-xs text-slate-400">B22DCPT244</p>
          </div>
        </div>
      </div>
    </header>
  );
}
