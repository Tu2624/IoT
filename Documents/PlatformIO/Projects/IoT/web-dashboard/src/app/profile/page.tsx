import Card from '@/components/Card';
import { Github, FileText, LayoutTemplate, Braces } from 'lucide-react';
import Image from 'next/image';

export default function Profile() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 mt-10">
      
      <Card className="p-8 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center md:items-start">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-40 h-40 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center overflow-hidden">
                 {/* Placeholder for real image later, using initial now */}
                 <span className="text-6xl font-bold bg-gradient-to-tr from-blue-400 to-indigo-400 bg-clip-text text-transparent">VĐT</span>
              </div>
            </div>
            <div className="text-center">
               <h2 className="text-2xl font-bold text-white">Vũ Đình Tú</h2>
               <p className="text-blue-400 font-medium tracking-widest text-sm uppercase mt-1">Administrator</p>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 w-full relative">
            <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-700/50 pb-4">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Thông tin sinh viên
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">Mã Sinh Viên</p>
                <p className="text-lg font-semibold text-slate-200">B22DCPT244</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">Ngày sinh</p>
                <p className="text-lg font-semibold text-slate-200">02/02/2004</p>
              </div>
              <div className="space-y-1">
                 <p className="text-sm font-medium text-slate-400">Lớp</p>
                 <p className="text-lg font-semibold text-slate-200">D22CQPT01-N</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-700/50 pb-4">
              <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
              Báo cáo bài tập lớn
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="#" className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/60 hover:border-slate-600 transition-all group">
                <Github className="w-6 h-6 text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-300 group-hover:text-white">Github</span>
              </a>
              <a href="#" className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/60 hover:border-slate-600 transition-all group">
                <LayoutTemplate className="w-6 h-6 text-pink-400 group-hover:text-pink-300" />
                <span className="font-medium text-slate-300 group-hover:text-white">Figma</span>
              </a>
              <a href="#" className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/60 hover:border-slate-600 transition-all group">
                <FileText className="w-6 h-6 text-red-400 group-hover:text-red-300" />
                <span className="font-medium text-slate-300 group-hover:text-white">Báo cáo PDF</span>
              </a>
              <a href="#" className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/60 hover:border-slate-600 transition-all group">
                <Braces className="w-6 h-6 text-green-400 group-hover:text-green-300" />
                <span className="font-medium text-slate-300 group-hover:text-white">API Docs</span>
              </a>
            </div>
            
          </div>
        </div>
      </Card>
    </div>
  );
}
