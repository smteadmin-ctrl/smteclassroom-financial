"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function MobileNav() {
  return (
    <header className="mobile-topbar sticky top-0 z-40 flex shrink-0 items-center justify-between border-b px-3 sm:px-4 md:hidden" style={{ background: "color-mix(in srgb, var(--panel) 84%, transparent)", borderColor: "var(--line)", backdropFilter: "var(--blur-nav)" }}>
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <span className="visual-gradient flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-black text-white shadow-md min-[390px]:h-9 min-[390px]:w-9">S</span>
        <span className="truncate text-sm min-[360px]:text-base">การเงินห้องเรียน</span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle compact />
      </div>
    </header>
  );
}
