"use client";
import { useEffect, useState, useMemo } from "react";
import { X, Edit, Trash2, Check, XIcon, Bell, MessageCircleWarning, ReceiptText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { useAppStore } from "@/lib/store";
import { deleteSchedule as deleteScheduleRemote } from "@/lib/supabase/schedules";
import { sendScheduleLineReminders } from "@/lib/supabase/schedules";
import { approveLinePaymentRequest, getLinePaymentRequests, updateLinePaymentRequest } from "@/lib/supabase/linePaymentRequests";
import { dbTransactionToTransaction, dbLinePaymentRequestToLinePaymentRequest } from "@/lib/supabase/adapter";
import type { LinePaymentRequest, Schedule } from "@/types";
import { toast } from "react-hot-toast";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EditScheduleModal } from "./EditScheduleModal";
import { QuickPayModal } from "../transactions/QuickPayModal";

type ScheduleDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  initialStatusFilter?: "paid" | "unpaid";
};

export function ScheduleDetailModal({ isOpen, onClose, schedule, initialStatusFilter }: ScheduleDetailModalProps) {
  const data = useAppStore((state) => state.data);
  const deleteSchedule = useAppStore((state) => state.deleteSchedule);
  const addTransaction = useAppStore((state) => state.addTransaction);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [quickPayStudent, setQuickPayStudent] = useState<{ scheduleId: string; studentId: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">(initialStatusFilter || "all");
  const [sendingReminder, setSendingReminder] = useState<"all" | string | null>(null);
  const [lineRequests, setLineRequests] = useState<LinePaymentRequest[]>([]);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);

  // Get students for this schedule
  const scheduleStudents = data.students
    .filter((s) => schedule.studentIds.includes(s.id))
    .sort((a, b) => a.number - b.number);

  // Get transactions for this schedule
  const scheduleTransactions = useMemo(
    () => data.transactions.filter((t) => t.source === "schedule" && t.scheduleId === schedule.id),
    [data.transactions, schedule.id]
  );

  // Aggregate per student for partial/multi method payments
  const perStudentTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of scheduleTransactions) {
      if (t.studentId) {
        totals[t.studentId] = (totals[t.studentId] || 0) + t.amount;
      }
    }
    return totals;
  }, [scheduleTransactions]);

  const paidStudentIds = useMemo(
    () =>
      new Set(
        Object.entries(perStudentTotals)
          .filter(([, total]) => total >= schedule.amountPerItem)
          .map(([studentId]) => studentId)
      ),
    [perStudentTotals, schedule.amountPerItem]
  );

  // Filter students based on status filter
  const filteredStudents = useMemo(() => {
    if (statusFilter === "all") return scheduleStudents;
    if (statusFilter === "paid") return scheduleStudents.filter(s => paidStudentIds.has(s.id));
    return scheduleStudents.filter(s => !paidStudentIds.has(s.id));
  }, [scheduleStudents, statusFilter, paidStudentIds]);

  // Calculate stats
  const totalStudents = scheduleStudents.length;
  const paidCount = paidStudentIds.size;
  const unpaidCount = totalStudents - paidCount;
  const totalCollected = scheduleTransactions.reduce((sum, t) => sum + t.amount, 0);
  const targetAmount = schedule.amountPerItem * totalStudents;
  const totalRemaining = Math.max(0, targetAmount - totalCollected);
  const unpaidStudents = scheduleStudents.filter((student) => !paidStudentIds.has(student.id));
  const unpaidStudentsWithLine = unpaidStudents.filter((student) => Boolean(student.lineUserId));
  const missingLineCount = unpaidStudents.length - unpaidStudentsWithLine.length;
  const daysLeft = schedule.endDate
    ? differenceInDays(new Date(schedule.endDate), new Date())
    : null;
  const pendingRequests = lineRequests.filter((request) => ["pending_review", "cash_pending"].includes(request.status));

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    getLinePaymentRequests({ scheduleId: schedule.id, status: "pending_review,cash_pending" })
      .then((requests) => {
        if (!cancelled) setLineRequests(requests.map(dbLinePaymentRequestToLinePaymentRequest));
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) toast.error("โหลดรายการรอตรวจสอบไม่สำเร็จ");
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, schedule.id]);

  const handleDelete = async () => {
    try {
      await deleteScheduleRemote(schedule.id);
      deleteSchedule(schedule.id);
      toast.success("ลบกำหนดการสำเร็จ");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSendReminder = async (studentIds?: string[]) => {
    const mode = studentIds?.length === 1 ? studentIds[0] : "all";
    setSendingReminder(mode);
    try {
      const result = await sendScheduleLineReminders(schedule.id, studentIds);
      if (result.sent > 0) {
        toast.success(`ส่ง LINE แล้ว ${result.sent} คน${result.skippedMissingLineId ? ` • ไม่มี LINE ID ${result.skippedMissingLineId} คน` : ""}`);
      } else if (result.skippedMissingLineId > 0) {
        toast.error("ยังส่งไม่ได้: นักเรียนที่ค้างชำระยังไม่มี LINE User ID");
      } else if (result.alreadyPaid > 0) {
        toast.success("รายการนี้ชำระครบแล้ว");
      } else {
        toast.error("ส่งแจ้งเตือนไม่สำเร็จ");
      }

      if (result.failed > 0) {
        toast.error(`ส่งไม่สำเร็จ ${result.failed} คน ตรวจสอบ LINE User ID หรือ Channel token`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ส่งแจ้งเตือนไม่สำเร็จ");
    } finally {
      setSendingReminder(null);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setReviewingRequestId(requestId);
    try {
      const result = await approveLinePaymentRequest(requestId);
      if (result.transaction) addTransaction(dbTransactionToTransaction(result.transaction));
      setLineRequests((requests) => requests.filter((request) => request.id !== requestId));
      toast.success("อนุมัติและบันทึกชำระเงินแล้ว");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "อนุมัติไม่สำเร็จ");
    } finally {
      setReviewingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setReviewingRequestId(requestId);
    try {
      await updateLinePaymentRequest(requestId, { status: "rejected", note: "Rejected by treasurer" });
      setLineRequests((requests) => requests.filter((request) => request.id !== requestId));
      toast.success("ปฏิเสธรายการแล้ว");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ปฏิเสธไม่สำเร็จ");
    } finally {
      setReviewingRequestId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-2xl"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="apple-panel relative flex max-h-[min(760px,calc(100dvh-1.5rem))] w-full max-w-3xl flex-col overflow-hidden"
            >
              {/* Header */}
              <div
                className="sticky top-0 z-10 shrink-0 border-b px-4 py-3 sm:px-6 sm:py-4"
                style={{
                  borderColor: "var(--line)",
                  background: "color-mix(in srgb, var(--panel-solid) 82%, transparent)",
                  backdropFilter: "var(--blur-nav)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{schedule.name}</h2>
                    <div className="mt-2 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                      <span>เริ่ม: {format(new Date(schedule.startDate), "dd/MM/yyyy")}</span>
                      {schedule.endDate && (
                        <>
                          <span>•</span>
                          <span>สิ้นสุด: {format(new Date(schedule.endDate), "dd/MM/yyyy")}</span>
                        </>
                      )}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <>
                          <span>•</span>
                          <span className="text-orange-600 dark:text-orange-400">
                            เหลือ {daysLeft} วัน
                          </span>
                        </>
                      )}
                    </div>
                    {schedule.details && (
                      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {schedule.details}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendReminder(unpaidStudentsWithLine.map((student) => student.id))}
                      disabled={unpaidStudentsWithLine.length === 0 || sendingReminder !== null}
                      className="apple-icon-button h-9 w-9 rounded-xl disabled:opacity-45"
                      aria-label="ส่งแจ้งเตือน LINE"
                      title={unpaidStudentsWithLine.length === 0 ? "ยังไม่มีนักเรียนค้างชำระที่มี LINE User ID" : `ส่งแจ้งเตือน ${unpaidStudentsWithLine.length} คน`}
                    >
                      <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="apple-icon-button h-9 w-9 rounded-xl"
                      aria-label="แก้ไข"
                    >
                      <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: schedule.id, name: schedule.name })}
                      className="apple-icon-button h-9 w-9 rounded-xl"
                      aria-label="ลบ"
                    >
                      <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </button>
                    <button
                      onClick={onClose}
                      className="apple-icon-button h-9 w-9 rounded-xl"
                      aria-label="ปิด"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Summary Cards */}
              <div className="border-b px-4 py-4 sm:px-6" style={{ borderColor: "var(--line)" }}>
                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                  <div className="rounded-xl border border-blue-200/60 bg-blue-50/80 p-4 dark:border-blue-500/20 dark:bg-blue-950/20">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      จำนวนต่อรายการ
                    </div>
                    <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {schedule.amountPerItem.toLocaleString()} ฿
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/80 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      เก็บได้
                    </div>
                    <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {totalCollected.toLocaleString()} ฿
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {paidCount}/{totalStudents} คน
                    </div>
                  </div>

                  <div className="apple-soft rounded-xl p-4">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      ยอดค้าง
                    </div>
                    <div className="mt-1 text-2xl font-bold">
                      {totalRemaining.toLocaleString()} ฿
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {unpaidCount} คนค้าง
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2 rounded-2xl border p-3 text-sm sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--line)", background: "var(--panel-soft)" }}>
                  <div className="min-w-0">
                    <div className="font-semibold">แจ้งเตือนผ่าน LINE</div>
                    <div className="text-xs text-muted">
                      พร้อมส่ง {unpaidStudentsWithLine.length} คน
                      {missingLineCount > 0 ? ` • ไม่มี LINE User ID ${missingLineCount} คน` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendReminder(unpaidStudentsWithLine.map((student) => student.id))}
                    disabled={unpaidStudentsWithLine.length === 0 || sendingReminder !== null}
                    className="apple-button justify-center px-3 py-2 text-sm disabled:opacity-45"
                  >
                    <Bell className="h-4 w-4" />
                    {sendingReminder === "all" ? "กำลังส่ง..." : "ส่งแจ้งเตือน"}
                  </button>
                </div>
              </div>

              {pendingRequests.length > 0 && (
                <div className="border-b px-4 py-4 sm:px-6" style={{ borderColor: "var(--line)" }}>
                  <div className="mb-3 flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium">รายการจาก LINE รอตรวจสอบ ({pendingRequests.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {pendingRequests.map((request) => {
                      const student = data.students.find((item) => item.id === request.studentId);
                      return (
                        <div key={request.id} className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: "var(--panel-soft)" }}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="font-semibold">
                                {student ? `${student.prefix} ${student.firstName} ${student.lastName}` : "ไม่พบนักเรียน"}
                              </div>
                              <div className="text-sm text-muted">
                                {request.method === "cash" ? "เงินสด" : request.method === "truemoney" ? "TrueMoney" : "K PLUS"} • {request.amount.toLocaleString()} ฿
                                <span className="mx-1">•</span>
                                {request.status === "cash_pending" ? "รอรับเงินสด" : "รอตรวจสลิป"}
                              </div>
                              {request.slipUrl && (
                                <a href={request.slipUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-sm font-medium text-blue-600 hover:underline">
                                  เปิดดูสลิป
                                </a>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:flex">
                              <button
                                type="button"
                                onClick={() => handleRejectRequest(request.id)}
                                disabled={reviewingRequestId !== null}
                                className="apple-ghost-button justify-center px-3 py-2 text-sm disabled:opacity-45"
                              >
                                ปฏิเสธ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(request.id)}
                                disabled={reviewingRequestId !== null}
                                className="apple-button justify-center px-3 py-2 text-sm disabled:opacity-45"
                              >
                                อนุมัติ
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Student List */}
              <div className="px-4 py-4 sm:px-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium">
                    รายชื่อนักเรียน ({filteredStudents.length}/{scheduleStudents.length} คน)
                  </h3>
                  <div className="flex gap-1">
                    {[
                      { key: "all", label: "ทั้งหมด" },
                      { key: "paid", label: "ชำระแล้ว" },
                      { key: "unpaid", label: "ค้างชำระ" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key as typeof statusFilter)}
                        className={`rounded-full px-3 py-1 text-xs transition-colors ${statusFilter === tab.key
                            ? "bg-blue-600 text-white"
                            : "bg-white/60 hover:bg-white dark:bg-zinc-800/70 dark:hover:bg-zinc-700"
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {filteredStudents.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500">
                      {statusFilter === "all" ? "ไม่มีนักเรียนในกำหนดการนี้" : statusFilter === "paid" ? "ยังไม่มีนักเรียนที่ชำระแล้ว" : "ไม่มีนักเรียนค้างชำระ"}
                    </div>
                  ) : (
                    filteredStudents.map((student, idx) => {

                      const totalPaid = perStudentTotals[student.id] || 0;
                      const hasPaid = totalPaid >= schedule.amountPerItem;
                      const remain = Math.max(0, schedule.amountPerItem - totalPaid);
                      return (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          onClick={() => {
                            if (!hasPaid) {
                              setQuickPayStudent({ scheduleId: schedule.id, studentId: student.id });
                            }
                          }}
                          className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${!hasPaid ? "cursor-pointer hover:bg-blue-50/80 dark:hover:bg-blue-950/20" : ""
                            }`}
                          style={{ borderColor: "var(--line)" }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${hasPaid
                                ? "bg-emerald-100 dark:bg-emerald-950/30"
                                : "bg-rose-100 dark:bg-rose-950/30"
                                }`}
                            >
                              {hasPaid ? (
                                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <XIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {student.prefix} {student.firstName} {student.lastName}
                              </div>
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                เลขที่ {student.number} • {student.nickName}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-right">
                            {hasPaid ? (
                              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">ชำระแล้ว</div>
                            ) : totalPaid > 0 ? (
                              <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                ชำระแล้ว {totalPaid.toLocaleString()} ฿
                                <div className="text-xs text-amber-600 dark:text-amber-400">ค้าง {remain.toLocaleString()} ฿</div>
                              </div>
                            ) : (
                              <div className="text-sm font-medium text-rose-600 dark:text-rose-400">คลิกเพื่อชำระ</div>
                            )}
                            {!hasPaid && (
                              student.lineUserId ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleSendReminder([student.id]);
                                  }}
                                  disabled={sendingReminder !== null}
                                  className="apple-icon-button h-8 w-8 rounded-xl disabled:opacity-45"
                                  aria-label={`ส่ง LINE ถึง ${student.firstName}`}
                                  title="ส่งแจ้งเตือน LINE"
                                >
                                  <Bell className="h-4 w-4 text-blue-600" />
                                </button>
                              ) : (
                                <span title="ยังไม่มี LINE User ID">
                                  <MessageCircleWarning className="h-5 w-5 text-amber-500" />
                                </span>
                              )
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
              </div>
            </motion.div>
          </div>

          {/* Delete Confirmation */}
          <ConfirmDialog
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            title="ยืนยันการลบกำหนดการ"
            message={`คุณต้องการลบกำหนดการ "${deleteConfirm?.name}" ใช่หรือไม่?`}
            confirmText="ลบ"
            confirmVariant="danger"
            onConfirm={handleDelete}
          />

          {/* Edit Modal */}
          <EditScheduleModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            schedule={schedule}
          />

          {/* Quick Pay Modal */}
          {quickPayStudent && (
            <QuickPayModal
              isOpen={!!quickPayStudent}
              onClose={() => setQuickPayStudent(null)}
              scheduleId={quickPayStudent.scheduleId}
              studentId={quickPayStudent.studentId}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
