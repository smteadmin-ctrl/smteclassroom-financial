"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Pocket } from "@/types";
import { useAppStore } from "@/lib/store";
import { calculatePocketBalance } from "@/lib/calculations";
import { Wallet, RefreshCw, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    pocket: Pocket;
    onTransfer: (pocket: Pocket) => void;
    onEdit: (pocket: Pocket) => void;
    onDetails: (pocket: Pocket) => void;
}

const COLORS: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500",
};

const BG_COLORS: Record<string, string> = {
    blue: "from-blue-500/20",
    emerald: "from-emerald-500/20",
    rose: "from-rose-500/20",
    amber: "from-amber-500/20",
    indigo: "from-indigo-500/20",
};

export function PocketCard({ pocket, onTransfer, onEdit, onDetails }: Props) {
    const data = useAppStore((state) => state.data);
    const balance = useMemo(() => calculatePocketBalance(data, pocket.id), [data, pocket.id]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "apple-card hover-lift relative min-w-0 overflow-hidden bg-gradient-to-br to-transparent p-2.5 transition-all sm:p-5",
                BG_COLORS[pocket.color] || "from-zinc-500/10"
            )}
        >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-lg sm:h-11 sm:w-11", COLORS[pocket.color] || "bg-zinc-500")}>
                        <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate font-semibold" title={pocket.name}>{pocket.name}</div>
                        {pocket.isDefault && <div className="text-xs text-muted font-medium">กระเป๋าหลัก</div>}
                    </div>
                </div>
            </div>

            <div className="mt-3 sm:mt-4">
                <div className="text-balance-safe text-lg font-black tracking-tight sm:text-2xl">{balance.toLocaleString()} ฿</div>
                <div className="text-xs text-muted sm:text-sm">ยอดคงเหลือ</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-2">
                <button
                    onClick={() => onTransfer(pocket)}
                    className="apple-ghost-button flex-1 gap-1 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span className="sm:hidden">โอน</span>
                    <span className="hidden sm:inline">โอนย้าย</span>
                </button>
                <button
                    onClick={() => onEdit(pocket)}
                    className="apple-ghost-button flex-1 gap-1 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
                >
                    <Edit2 className="h-3.5 w-3.5" />
                    แก้ไข
                </button>
            </div>
            <button
                onClick={() => onDetails(pocket)}
                className="apple-ghost-button mt-1.5 w-full px-3 py-1.5 text-xs sm:mt-2 sm:py-2 sm:text-sm"
            >
                ดูรายการ
            </button>
        </motion.div>
    );
}
