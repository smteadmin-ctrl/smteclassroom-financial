import { createHmac, timingSafeEqual } from "crypto";
import { badRequest, ok, serverError } from "@/lib/api/response";
import { listRecords, updateRecord, type Row } from "@/lib/supabase/server";
import { mapStudent } from "@/lib/supabase/mappers";

type LineWebhookBody = {
  events?: LineWebhookEvent[];
};

type LineWebhookEvent = {
  type?: string;
  replyToken?: string;
  source?: {
    type?: string;
    userId?: string;
  };
  message?: {
    type?: string;
    text?: string;
  };
};

const studentColumns = ["line_user_id"];

export async function GET() {
  return ok({
    status: "ok",
    service: "line-webhook",
    usage: "Set this endpoint as your LINE Messaging API webhook URL.",
  });
}

export async function POST(request: Request) {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelSecret) return badRequest("Missing LINE_CHANNEL_SECRET");

    const bodyText = await request.text();
    const signature = request.headers.get("x-line-signature") || "";
    if (!isValidLineSignature(bodyText, signature, channelSecret)) {
      return badRequest("Invalid LINE signature");
    }

    const body = JSON.parse(bodyText) as LineWebhookBody;
    const events = Array.isArray(body.events) ? body.events : [];
    await Promise.all(events.map(handleLineEvent));

    return ok({ status: "ok" });
  } catch (error) {
    return serverError(error);
  }
}

async function handleLineEvent(event: LineWebhookEvent) {
  if (event.type !== "message") return;
  if (event.message?.type !== "text") return;
  if (event.source?.type !== "user" || !event.source.userId) return;

  const text = event.message.text?.trim() || "";
  const number = parseRegistrationNumber(text);

  if (!number) {
    await replyLine(event.replyToken, [
      "พิมพ์เลขที่เพื่อผูกบัญชี LINE กับระบบการเงินห้องเรียน",
      "ตัวอย่าง: ลงทะเบียน 24",
    ].join("\n"));
    return;
  }

  const studentRows = await listRecords<Row>("students");
  const students = studentRows.map(mapStudent);
  const student = students.find((item) => item.number === number);

  if (!student) {
    await replyLine(event.replyToken, `ไม่พบนักเรียนเลขที่ ${number}\nกรุณาตรวจสอบเลขที่แล้วส่งใหม่ เช่น ลงทะเบียน ${number}`);
    return;
  }

  const duplicateStudents = students.filter((item) => item.line_user_id === event.source?.userId && item.id !== student.id);
  await Promise.all(
    duplicateStudents.map((duplicate) =>
      updateRecord<Row>("students", duplicate.id, { line_user_id: null }, studentColumns)
    )
  );

  await updateRecord<Row>("students", student.id, { line_user_id: event.source.userId }, studentColumns);

  await replyLine(event.replyToken, [
    "ลงทะเบียน LINE สำเร็จ",
    `${student.prefix} ${student.first_name} ${student.last_name}`,
    `เลขที่ ${student.number}${student.nick_name ? ` (${student.nick_name})` : ""}`,
    "ระบบจะใช้บัญชีนี้สำหรับแจ้งเตือนกำหนดการชำระเงิน",
  ].join("\n"));
}

function parseRegistrationNumber(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(?:ลงทะเบียน|register)?\s*(\d{1,3})$/i);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function isValidLineSignature(bodyText: string, signature: string, channelSecret: string) {
  if (!signature) return false;

  const digest = createHmac("sha256", channelSecret).update(bodyText).digest("base64");
  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  return signatureBuffer.length === digestBuffer.length && timingSafeEqual(signatureBuffer, digestBuffer);
}

async function replyLine(replyToken: string | undefined, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !replyToken) return;

  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LINE reply API ${response.status}${body ? `: ${body}` : ""}`);
  }
}
