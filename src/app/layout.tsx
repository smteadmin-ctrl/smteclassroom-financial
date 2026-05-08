import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import BottomTabNav from "../components/layout/BottomTabNav";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { HydrationGate } from "@/components/layout/HydrationGate";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบการเงินห้องเรียน 5.0",
  description:
    "ระบบจัดการการเงินห้องเรียน รายการเงิน กำหนดการ หมวดหมู่ และข้อมูลนักเรียน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <div className="ambient-bg" aria-hidden="true" />
          <Toaster position="top-right" toastOptions={{
            style: {
              borderRadius: "18px",
              background: "var(--panel-solid)",
              color: "var(--foreground)",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow-float)",
            },
          }} />
          <HydrationGate fallback={<LoadingScreen />}>
            <div className="relative h-dvh overflow-hidden p-0 md:p-4 xl:p-5">
              <div className="app-shell flex h-full min-h-0 flex-col md:grid md:grid-cols-[104px_1fr] lg:grid-cols-[220px_1fr] md:rounded-[26px] xl:rounded-[30px]">
                <aside className="hidden min-h-0 overflow-hidden border-r md:block" style={{ borderColor: "var(--line)" }}>
                  <Sidebar />
                </aside>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <MobileNav />
                  <main className="mx-auto flex w-full max-w-[1420px] min-w-0 flex-1 flex-col overflow-hidden px-2.5 py-3 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4 md:min-h-0 md:px-5 md:py-6 md:pb-6 lg:px-7 xl:px-8 xl:py-8">{children}</main>
                  <BottomTabNav />
                </div>
              </div>
            </div>
          </HydrationGate>
        </ThemeProvider>
      </body>
    </html>
  );
}

// MobileNav is a client component rendered only on small screens
