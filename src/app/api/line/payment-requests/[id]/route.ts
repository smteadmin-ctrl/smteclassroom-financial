import { notFound, ok, serverError } from "@/lib/api/response";
import { getRecord, updateRecord, type Row } from "@/lib/supabase/server";
import { mapLinePaymentRequest } from "@/lib/supabase/mappers";
import type { LinePaymentRequestUpdate } from "@/types/supabase";

type RouteContext = { params: Promise<{ id: string }> };

const requestColumns = ["status", "method", "slip_url", "slip_pathname", "transaction_id", "note"];

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const row = await getRecord<Row>("line_payment_requests", id);
    if (!row) return notFound("Line payment request not found");
    return ok(mapLinePaymentRequest(row));
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as LinePaymentRequestUpdate;
    const row = await updateRecord<Row>("line_payment_requests", id, body, requestColumns);
    if (!row) return notFound("Line payment request not found");
    return ok(mapLinePaymentRequest(row));
  } catch (error) {
    return serverError(error);
  }
}
