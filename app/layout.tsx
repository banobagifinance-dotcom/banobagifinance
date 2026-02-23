import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thehaggi Assets",
  description: "ระบบจัดการสินทรัพย์ พร้อม QR Code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body className="min-h-screen antialiased bg-slate-900 text-slate-100">
        <header className="border-b border-slate-700 bg-slate-900/90 backdrop-blur sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg text-slate-100">
              Thehaggi Assets
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/"
                className="text-slate-300 hover:text-white"
              >
                หน้าแรก
              </Link>
              <Link
                href="/add"
                className="text-sky-400 hover:text-sky-300 font-medium"
              >
                เพิ่มสินทรัพย์
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
