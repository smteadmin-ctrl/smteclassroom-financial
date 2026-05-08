import { badRequest, ok, serverError } from "@/lib/api/response";

const RICH_MENU_SIZE = { width: 2500, height: 843 };

export async function POST() {
  try {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) return badRequest("Missing LINE_CHANNEL_ACCESS_TOKEN");

    const richMenuId = await createRichMenu(token);
    const imageUrl = process.env.LINE_RICH_MENU_IMAGE_URL;
    let imageUploaded = false;

    if (imageUrl) {
      await uploadRichMenuImage(token, richMenuId, imageUrl);
      imageUploaded = true;
    }

    await setDefaultRichMenu(token, richMenuId);

    return ok({
      richMenuId,
      imageUploaded,
      note: imageUploaded
        ? "Rich menu created and set as default."
        : "Rich menu created and set as default. Add LINE_RICH_MENU_IMAGE_URL to upload a visual image.",
    });
  } catch (error) {
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
          bounds: { x: 0, y: 0, width: 1250, height: 843 },
          action: {
            type: "message",
            label: "ชำระเงิน",
            text: "ชำระเงิน",
          },
        },
        {
          bounds: { x: 1250, y: 0, width: 625, height: 843 },
          action: {
            type: "message",
            label: "สถานะ",
            text: "ชำระเงิน",
          },
        },
        {
          bounds: { x: 1875, y: 0, width: 625, height: 843 },
          action: {
            type: "uri",
            label: "เว็บแอป",
            uri: process.env.NEXT_PUBLIC_APP_URL || "https://classroom-finance-5.vercel.app",
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

async function uploadRichMenuImage(token: string, richMenuId: string, imageUrl: string) {
  const image = await fetch(imageUrl);
  if (!image.ok) throw new Error(`Failed to fetch rich menu image: ${image.status}`);
  const contentType = image.headers.get("content-type") || "image/png";
  const data = await image.arrayBuffer();

  const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": contentType,
    },
    body: data,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LINE rich menu image API ${response.status}${body ? `: ${body}` : ""}`);
  }
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
