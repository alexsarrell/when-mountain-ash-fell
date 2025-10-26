import fs from "fs";
import path from "path";

export function encodeImageToBase64(imagePath: string): {
  type: string;
  inline_data: {
    data: string;
    mime_type: string;
  };
} {
  console.log("Generate inlineData for image", imagePath);
  const imageBuffer = fs.readFileSync(imagePath);

  const base64Image = imageBuffer.toString("base64");

  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
  };

  const mimeType = mimeTypes[ext] || "image/jpeg";

  return {
    type: "inline_data",
    inline_data: {
      data: base64Image,
      mime_type: mimeType,
    },
  };
}
