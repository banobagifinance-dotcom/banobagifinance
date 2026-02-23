import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import HeaderNav from "./components/HeaderNav";

export const metadata: Metadata = {
  title: "Thehagi Assets",
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
        <AuthProvider>
          <HeaderNav />
          <main className="max-w-6xl mx-auto px-4 py-6 animate-page-enter">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
