import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { badRequest, ok, serverError } from "@/lib/api/response";

const APP_URL = "https://classroom-finance-5.vercel.app";
const RICH_MENU_IMAGE_PATH = join(process.cwd(), "public/line/rich-menu.png");
const RICH_MENU_SIZE = { width: 1200, height: 405 };
const MAX_RICH_MENU_IMAGE_BYTES = 1024 * 1024;
const RICH_MENU_IMAGE_CONTENT_TYPE = "image/png";

type RichMenuImageResult =
  | { uploaded: true }
  | { uploaded: false; warning: string };

export async function POST() {
  let richMenuId: string | null = null;

  try {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) return badRequest("Missing LINE_CHANNEL_ACCESS_TOKEN");

    richMenuId = await createRichMenu(token);
    const imageResult = await uploadRichMenuImage(token, richMenuId);

    await setDefaultRichMenu(token, richMenuId);

    return ok({
      richMenuId,
      imageUploaded: imageResult.uploaded,
      imageWarning: imageResult.uploaded ? undefined : imageResult.warning,
      note: imageResult.uploaded
        ? "Rich menu created and set as default."
        : "Rich menu created and set as default. Check public/line/rich-menu.png for the visual menu image.",
    });
  } catch (error) {
    if (richMenuId) await deleteRichMenu(process.env.LINE_CHANNEL_ACCESS_TOKEN, richMenuId);
    return serverError(error);
  }
}

async function createRichMenu(token: string) {
  const response = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      size: RICH_MENU_SIZE,
      selected: true,
      name: "Classroom Finance Menu",
      chatBarText: "เมนูการเงิน",
      areas: [
        {
          bounds: { x: 0, y: 0, width: 240, height: 405 },
          action: {
            type: "message",
            label: "ชำระเงิน",
            text: "ชำระเงิน",
          },
        },
        {
          bounds: { x: 240, y: 0, width: 240, height: 405 },
          action: {
            type: "message",
            label: "สถานะ",
            text: "เมนูสถานะ",
          },
        },
        {
          bounds: { x: 480, y: 0, width: 240, height: 405 },
          action: {
            type: "message",
            label: "ประวัติ",
            text: "เมนูประวัติ",
          },
        },
        {
          bounds: { x: 720, y: 0, width: 240, height: 405 },
          action: {
            type: "message",
            label: "ลงทะเบียน",
            text: "ลงทะเบียน",
          },
        },
        {
          bounds: { x: 960, y: 0, width: 240, height: 405 },
          action: {
            type: "uri",
            label: "เว็บแอป",
            uri: APP_URL,
          },
        },
      ],
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`LINE rich menu API ${response.status}: ${JSON.stringify(body)}`);
  if (!body?.richMenuId) throw new Error("LINE did not return richMenuId");
  return String(body.richMenuId);
}

async function uploadRichMenuImage(token: string, richMenuId: string): Promise<RichMenuImageResult> {
  let data: Buffer;
  try {
    data = await readFile(RICH_MENU_IMAGE_PATH);
  } catch {
    return {
      uploaded: false,
      warning: `Skipped rich menu image because ${RICH_MENU_IMAGE_PATH} was not found.`,
    };
  }

  if (data.byteLength > MAX_RICH_MENU_IMAGE_BYTES) {
    return {
      uploaded: false,
      warning: `Skipped rich menu image because it is too large (${formatBytes(data.byteLength)}). Use a JPEG or PNG under ${formatBytes(
        MAX_RICH_MENU_IMAGE_BYTES
      )}.`,
    };
  }

  const imageBody = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;

  const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": RICH_MENU_IMAGE_CONTENT_TYPE,
    },
    body: imageBody,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LINE rich menu image API ${response.status}${body ? `: ${body}` : ""}`);
  }

  return { uploaded: true };
}

async function deleteRichMenu(token: string | undefined, richMenuId: string) {
  if (!token) return;

  await fetch(`https://api.line.me/v2/bot/richmenu/${richMenuId}`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${token}`,
    },
  }).catch(() => null);
}

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function setDefaultRichMenu(token: string, richMenuId: string) {
  const response = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LINE default rich menu API ${response.status}${body ? `: ${body}` : ""}`);
  }
}
