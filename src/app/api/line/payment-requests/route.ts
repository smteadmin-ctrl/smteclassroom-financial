import { ok, serverError } from "@/lib/api/response";
import { listRecords, type Row } from "@/lib/supabase/server";
import { mapLinePaymentRequest } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scheduleId = url.searchParams.get("scheduleId");
    const status = url.searchParams.get("status");
    let rows = await listRecords<Row>("line_payment_requests");

    if (scheduleId) rows = rows.filter((row) => row.schedule_id === scheduleId);
    if (status) {
      const statuses = new Set(status.split(",").map((item) => item.trim()).filter(Boolean));
      rows = rows.filter((row) => statuses.has(String(row.status)));
    }

    rows.sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
    return ok(rows.map(mapLinePaymentRequest));
  } catch (error) {
    return serverError(error);
  }
}
