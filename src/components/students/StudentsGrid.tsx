"use client";
import { useState, memo, useMemo } from "react";
import { Plus, User, Upload, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import type { Student } from "@/types";
import { AddStudentModal } from "./AddStudentModal";
import { StudentDetailModal } from "./StudentDetailModal";

type StudentStats = {
  paidTotal: number;
  leftTotal: number;
  paidCount: number;
  totalSchedules: number;
};

const StudentCard = memo(({ student, stats, onClick }: { student: Student; stats: StudentStats; onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="apple-card hover-lift group min-w-0 cursor-pointer p-2.5 hover:shadow-xl sm:p-4"
  >
    <div className="mb-2 flex items-center justify-center sm:mb-3">
      {student.avatarUrl ? (
        <img
          src={student.avatarUrl}
          alt={student.firstName}
          className="h-12 w-12 rounded-full object-cover min-[390px]:h-14 min-[390px]:w-14 sm:h-20 sm:w-20"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl min-[390px]:h-14 min-[390px]:w-14 sm:h-20 sm:w-20 sm:rounded-3xl" style={{ background: "var(--primary-soft)" }}>
          <User className="h-6 w-6 text-[var(--primary)] sm:h-10 sm:w-10" />
        </div>
      )}
    </div>
    <div className="min-w-0 text-center">
      <div className="text-xs font-semibold text-[var(--muted-strong)]">เลขที่ {student.number}</div>
      <div className="truncate text-sm font-semibold sm:text-base" title={`${student.prefix} ${student.firstName} ${student.lastName}`}>
        {student.prefix} {student.firstName}
      </div>
      <div className="truncate text-xs font-medium text-[var(--muted-strong)] sm:text-sm">{student.nickName}</div>
    </div>
    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] min-[390px]:gap-2 sm:mt-3 sm:text-xs">
      <div className="rounded-xl p-1.5 sm:rounded-2xl sm:p-2" style={{ background: "color-mix(in srgb, var(--success) 18%, transparent)", color: "#047857" }}>
        <div className="font-semibold opacity-95">จ่ายแล้ว</div>
        <div className="font-semibold">{stats.paidTotal.toLocaleString()} ฿</div>
      </div>
      <div className="rounded-xl p-1.5 sm:rounded-2xl sm:p-2" style={{ background: "color-mix(in srgb, var(--warning) 20%, transparent)", color: "#b45309" }}>
        <div className="font-semibold opacity-95">ค้าง</div>
        <div className="font-semibold">{stats.leftTotal.toLocaleString()} ฿</div>
      </div>
      <div className="apple-soft col-span-2 rounded-xl p-1.5 text-[var(--muted-strong)] sm:rounded-2xl sm:p-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">สถานะกำหนดการ</span>
          <span className="shrink-0 pl-2 font-bold">{stats.paidCount}/{stats.totalSchedules}</span>
        </div>
      </div>
    </div>
  </motion.div>
));
StudentCard.displayName = "StudentCard";

export function StudentsGrid() {
  const storeData = useAppStore((s) => s.data);
  const sortedStudents = [...storeData.students].sort((a, b) => a.number - b.number);

  // Precompute payment aggregates per student across schedules
  const statsByStudent = useMemo(() => {
    const paidBySchedule: Record<string, Record<string, number>> = {};
    for (const t of storeData.transactions) {
      if (t.source !== "schedule" || !t.scheduleId || !t.studentId) continue;
      paidBySchedule[t.scheduleId] ||= {};
      paidBySchedule[t.scheduleId][t.studentId] = (paidBySchedule[t.scheduleId][t.studentId] || 0) + t.amount;
    }

    const result: Record<string, StudentStats> = {};
    for (const student of storeData.students) {
      let targetTotal = 0;
      let paidCappedTotal = 0;
      let paidCount = 0;
      const schedulesForStudent = storeData.schedules.filter((s) => s.studentIds.includes(student.id));
      for (const s of schedulesForStudent) {
        targetTotal += s.amountPerItem;
        const paidForThis = paidBySchedule[s.id]?.[student.id] || 0;
        if (paidForThis >= s.amountPerItem) paidCount += 1;
        paidCappedTotal += Math.min(paidForThis, s.amountPerItem);
      }
      const leftTotal = Math.max(0, Math.round((targetTotal - paidCappedTotal) * 100) / 100);
      result[student.id] = {
        paidTotal: Math.round(paidCappedTotal * 100) / 100,
        leftTotal,
        paidCount,
        totalSchedules: schedulesForStudent.length,
      };
    }
    return result;
  }, [storeData.transactions, storeData.students, storeData.schedules]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const addStudent = useAppStore((s) => s.addStudent);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      {selectedStudent && (
        <StudentDetailModal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          student={selectedStudent}
        />
      )}
      
      <div className="grid shrink-0 grid-cols-2 gap-2 pb-2 sm:flex sm:flex-wrap sm:items-center sm:pb-4">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="apple-button col-span-2 px-4 py-2 text-sm sm:col-span-1"
        >
          <Plus className="h-4 w-4" /> เพิ่มนักเรียนเดี่ยว
        </button>
        <label className="apple-ghost-button cursor-pointer px-3 py-2 text-sm">
          <Upload className="h-4 w-4" /> นำเข้า CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setIsImporting(true);
              try {
                const text = await file.text();
                const { parseCSV } = await import("@/lib/csv");
                const rows = parseCSV(text);
                if (rows.length < 2) throw new Error("ไฟล์ไม่มีข้อมูล");
                const header = rows[0].map((h) => h.trim().toLowerCase());
                const required = ["prefix", "first_name", "last_name", "nick_name", "number"]; // nick_name value optional but header required
                const missing = required.filter((r) => !header.includes(r));
                if (missing.length) throw new Error("หัวข้อคอลัมน์ไม่ถูกต้อง ต้องมี: " + required.join(","));
                const prefixIdx = header.indexOf("prefix");
                const firstIdx = header.indexOf("first_name");
                const lastIdx = header.indexOf("last_name");
                const nickIdx = header.indexOf("nick_name");
                const numIdx = header.indexOf("number");

                const existingNumbers = new Set(storeData.students.map((s) => s.number));
                const seenNumbers = new Set<number>();
                const toCreate: Student[] = [];
                let invalid = 0;
                let duplicates = 0;

                for (let i = 1; i < rows.length; i++) {
                  const row = rows[i];
                  if (row.length < header.length) { invalid++; continue; }
                  const numberVal = Number(row[numIdx]);
                  if (!Number.isFinite(numberVal) || numberVal <= 0) { invalid++; continue; }
                  if (existingNumbers.has(numberVal) || seenNumbers.has(numberVal)) { duplicates++; continue; }
                  seenNumbers.add(numberVal);
                  toCreate.push({
                    id: "", // will be replaced by remote id after insert
                    prefix: row[prefixIdx].trim(),
                    firstName: row[firstIdx].trim(),
                    lastName: row[lastIdx].trim(),
                    nickName: row[nickIdx].trim() || undefined,
                    number: numberVal,
                  });
                }

                // Remote-first bulk create then update local store
                const { createStudents } = await import("@/lib/supabase/students");
                const { dbStudentToStudent } = await import("@/lib/supabase/adapter");
                const created = await createStudents(toCreate.map(s => ({
                  prefix: s.prefix,
                  first_name: s.firstName,
                  last_name: s.lastName,
                  nick_name: s.nickName,
                  number: s.number,
                  avatar_url: undefined,
                })));
                created.map(dbStudentToStudent).forEach(addStudent);
                const toastMod = await import("react-hot-toast");
                const msg = `นำเข้า ${created.length} คนสำเร็จ` + (duplicates ? ` • ข้ามซ้ำ ${duplicates}` : "") + (invalid ? ` • ไม่ถูกต้อง ${invalid}` : "");
                toastMod.toast.success(msg);
              } catch (err: unknown) {
                const toastMod = await import("react-hot-toast");
                toastMod.toast.error(err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ");
              } finally {
                setIsImporting(false);
                e.target.value = ""; // reset file input
              }
            }}
            disabled={isImporting}
          />
        </label>
        <button
          onClick={async () => {
            const { toCSV } = await import("@/lib/csv");
            const rows = [
              ["prefix","first_name","last_name","nick_name","number"],
              ["นาย","สมชาย","ใจดี","บอล","1"],
              ["นางสาว","สมศรี","ใจงาม","ฝน","2"],
            ];
            const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "students-template.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
          className="apple-ghost-button px-3 py-2 text-sm"
        >
          <FileDown className="h-4 w-4" /> ดาวน์โหลดเทมเพลต CSV
        </button>
        {isImporting && <span className="col-span-2 self-center text-center text-sm text-blue-600 sm:col-span-1">กำลังนำเข้า...</span>}
      </div>

      <div className="student-card-scroll -mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-3 sm:pr-2">
        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {/* Add Student Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsAddModalOpen(true)}
          className="apple-card hover-lift flex min-h-[126px] cursor-pointer flex-col items-center justify-center border-2 border-dashed p-3 hover:shadow-xl sm:min-h-[200px] sm:p-4"
        >
          <Plus className="mb-2 h-8 w-8 text-zinc-400 sm:h-10 sm:w-10" />
          <div className="text-sm font-medium text-muted">เพิ่มนักเรียน</div>
        </motion.div>

        {sortedStudents.length === 0 && (
          <div className="apple-card col-span-full p-6 text-center text-muted">
            ยังไม่มีนักเรียนในระบบ — กดปุ่มเพิ่มนักเรียนเพื่อเริ่มสร้างการ์ด
          </div>
        )}

        {/* Student Cards */}
        {sortedStudents.map((student) => {
          const stats = statsByStudent[student.id] || { paidTotal: 0, leftTotal: 0, paidCount: 0, totalSchedules: 0 };
          return (
            <StudentCard
              key={student.id}
              student={student}
              stats={stats}
              onClick={() => setSelectedStudent(student)}
            />
          );
        })}
        </div>
      </div>
    </div>
  );
}
