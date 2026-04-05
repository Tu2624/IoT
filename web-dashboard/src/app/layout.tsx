import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'IoT Dashboard',
  description: 'Giao diện giám sát thiết bị IoT với ESP32',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-900 text-slate-100 flex flex-col min-h-screen font-sans">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
