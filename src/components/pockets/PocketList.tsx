"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Pocket } from "@/types";
import { PocketCard } from "./PocketCard";
import { TransferModal } from "./TransferModal";
import { EditPocketModal } from "./EditPocketModal";
import { PocketTransactionsModal } from "./PocketTransactionsModal";

export function PocketList() {
    const pockets = useAppStore((state) => state.data.pockets) || [];
    const [transferSource, setTransferSource] = useState<Pocket | null>(null);
    const [editPocket, setEditPocket] = useState<Pocket | null>(null);
    const [detailsPocket, setDetailsPocket] = useState<Pocket | null>(null);

    if (pockets.length === 0) return null;

    return (
        <div className="space-y-3 sm:space-y-4">
            <div>
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">กระเป๋าเงิน</h2>
                <p className="text-xs text-muted sm:text-sm">แยกยอดเงินตามช่องทางการรับจ่าย</p>
            </div>
            <div className="grid gap-2 min-[380px]:grid-cols-2 sm:gap-3 xl:grid-cols-3">
                {pockets.map((pocket) => (
                    <PocketCard
                        key={pocket.id}
                        pocket={pocket}
                        onTransfer={setTransferSource}
                        onEdit={setEditPocket}
                        onDetails={setDetailsPocket}
                    />
                ))}
            </div>

            {transferSource && (
                <TransferModal
                    isOpen={!!transferSource}
                    onClose={() => setTransferSource(null)}
                    sourcePocket={transferSource}
                />
            )}

            {editPocket && (
                <EditPocketModal
                    isOpen={!!editPocket}
                    onClose={() => setEditPocket(null)}
                    pocket={editPocket}
                />
            )}

            {detailsPocket && (
                <PocketTransactionsModal
                    isOpen={!!detailsPocket}
                    onClose={() => setDetailsPocket(null)}
                    pocket={detailsPocket}
                />
            )}
        </div>
    );
}
