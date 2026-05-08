import "server-only";

import { put } from "@vercel/blob";

export function appUploadUrl(pathname: string) {
  return `/api/uploads?pathname=${encodeURIComponent(pathname)}`;
}

export async function storePaymentProofImage({
  requestId,
  contentType,
  data,
}: {
  requestId: string;
  contentType: string;
  data: ArrayBuffer;
}) {
  const extension = extensionFromContentType(contentType);
  const pathname = `payment-slips/${requestId}-${Date.now()}${extension}`;
  const blob = await put(pathname, Buffer.from(data), {
    access: "private",
    contentType: contentType || "image/jpeg",
    allowOverwrite: true,
  });

  return {
    pathname: blob.pathname,
    url: appUploadUrl(blob.pathname),
  };
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  return ".jpg";
}
