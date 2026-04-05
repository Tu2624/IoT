import Card from '@/components/Card';
import { FileText, LayoutTemplate, Braces } from 'lucide-react';
import Image from 'next/image';
import profileImg from './profileImg.png';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.4a5.8 5.8 0 0 0-1.5-4 5.5 5.5 0 0 0 0-4s-1.2-.4-3.9 1.4a13.3 13.3 0 0 0-7 0c-2.7-1.8-3.9-1.4-3.9-1.4a5.5 5.5 0 0 0 0 4 5.8 5.8 0 0 0-1.5 4c0 3.4 3 5.4 6 5.4a4.8 4.8 0 0 0-1 3.2v3"></path>
      <path d="M9 18c-4.51 2-5-2-7-2"></path>
    </svg>
  );
}

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
                <Image
                  src={profileImg}
                  alt="Vũ Đình Tú"
                  className="w-full h-full object-cover"
                />
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
                <p className="text-lg font-semibold text-slate-200">02/06/2004</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">Lớp</p>
                <p className="text-lg font-semibold text-slate-200">D22CQPT02</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-700/50 pb-4">
              <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
              Báo cáo bài tập lớn
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="https://github.com/Tu2624/IoT.git" className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/60 hover:border-slate-600 transition-all group">
                <GithubIcon className="w-6 h-6 text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-300 group-hover:text-white">Github</span>
              </a>
              <a href="https://www.figma.com/design/eBlJpPUTJWRcuJDx5wGMLY/IoT?node-id=0-1&p=f&t=DgstfueLLeuENA6R-0" className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/60 hover:border-slate-600 transition-all group">
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
