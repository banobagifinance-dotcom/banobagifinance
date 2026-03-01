"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function HeaderNav() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="no-print border-b border-slate-700 bg-slate-900/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between sm:items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-slate-100 hover:text-sky-300 transition-colors duration-200 shrink-0">
          <Image
            src="/logo.jpg"
            alt="Thehagi Assets"
            width={80}
            height={80}
            className="object-contain"
          />
          <span className="hidden sm:inline">Thehagi Assets</span>
        </Link>
        <nav className="flex items-center justify-center gap-4 w-full sm:w-auto sm:justify-end">
          <Link
            href="/"
            className="text-slate-300 hover:text-white transition-colors duration-200"
          >
            หน้าแรก
          </Link>
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/add"
                    className="text-sky-400 hover:text-sky-300 font-medium transition-colors duration-200"
                  >
                    เพิ่มสินทรัพย์
                  </Link>
                  <Link
                    href="/print"
                    className="text-sky-400 hover:text-sky-300 font-medium transition-colors duration-200"
                  >
                    ปริ้น QR
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut().then(() => window.location.reload())}
                    className="text-slate-400 hover:text-slate-200 text-sm transition-colors duration-200"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <Link
                  href={
                    pathname && pathname !== "/login"
                      ? `/login?redirect=${encodeURIComponent(pathname)}`
                      : "/login"
                  }
                  className="text-sky-400 hover:text-sky-300 font-medium transition-colors duration-200"
                >
                  เข้าสู่ระบบ
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
