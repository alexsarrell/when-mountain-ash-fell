import axios from "axios";
import fs from "fs/promises";
import crypto from "crypto";
import retry from "async-retry";
import { uploadImageToS3 } from "./S3Client";
import { Hero } from "../types";
import OpenAI from "openai";

export class ImageService {
  constructor(
    private apiKey: string,
    private apiUrl: string,
    private storagePath: string,
    private model: string = "gemini-2.5-flash-image-preview",
  ) {}

  private isDataUrl(u: string) {
    return u.startsWith("data:");
  }

  private parseDataUrl(u: string): Buffer | undefined {
    const m = u.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return undefined;
    const b64 = m[2].replace(/\s+/g, "");
    return Buffer.from(b64, "base64");
  }

  private pickUrlOrBuffer(
    data: any,
  ): { url?: string; buffer?: Buffer } | undefined {
    const msg = data?.choices?.[0]?.message;
    const img = msg?.images?.[0];
    const u =
      img?.image_url?.url || img?.image_url || data?.image_url || data?.url;
    if (typeof u !== "string") return undefined;
    if (this.isDataUrl(u)) {
      const buf = this.parseDataUrl(u);
      if (!buf) return undefined;
      return { buffer: buf };
    }
    return { url: u };
  }

  private async fetchToBuffer(url: string): Promise<Buffer> {
    const r = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(r.data);
  }

  private async buildMessages(
    prompt: string,
    previousImageUrl: string | undefined = undefined,
  ): Promise<{
    messages: PredictMessage[];
    publicImageUrl: string | undefined;
  }> {
    if (!previousImageUrl) {
      return {
        messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
        publicImageUrl: undefined,
      };
    } else {
      const publicUrl = decodeURIComponent(
        await uploadImageToS3(
          process.env.S3_BUCKET || "",
          `when-mountain-ash-fell/${decodeURIComponent(previousImageUrl)}`,
          await fs.readFile(previousImageUrl),
          process.env.S3_BUCKET_KEY || "",
        ),
      );
      const imageMessage = {
        type: "image_url" as const,
        image_url: {
          url: publicUrl,
        },
      };
      return {
        messages: [
          {
            role: "user",
            content: [imageMessage, { type: "text", text: prompt }],
          },
        ],
        publicImageUrl: publicUrl,
      };
    }
  }

  private async generate(
    prefix: string,
    messages: PredictMessage[],
  ): Promise<string | undefined> {
    console.log("image: generate start", { prefix, model: this.model });

    const res = await axios.post(
      `${this.apiUrl.replace(/\/$/, "")}/predict`,
      {
        model: this.model,
        messages: messages,
      },
      {
        headers: {
          "MLP-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("image: predict status", res?.status);

    const ref = this.pickUrlOrBuffer(res.data);
    if (!ref) {
      console.log("image: no image found in response");
      return undefined;
    }

    await fs.mkdir(this.storagePath, { recursive: true });
    const fileName = `${prefix}_${crypto.randomUUID()}.png`;
    const filePath = `${this.storagePath}/${fileName}`;

    if (ref.buffer) {
      console.log("image: writing buffer", { bytes: ref.buffer.length });
      await fs.writeFile(filePath, ref.buffer);
    } else if (ref.url) {
      console.log("image: downloading url", ref.url.slice(0, 128));
      const buf = await this.fetchToBuffer(ref.url);
      console.log("image: downloaded bytes", buf.length);
      await fs.writeFile(filePath, buf);
    } else {
      console.log("image: invalid ref");
      return undefined;
    }

    console.log("image: saved", filePath);
    return `/images/generated/${fileName}`;
  }

  async generateCharacterImage(
    prompt: string,
    character: Hero | undefined = undefined,
    previousImageUrl: string
  ): Promise<string | undefined> {
    return retry(
      async (attempt) => {
        console.log("Generate character image attempt", attempt);
        const messages = await this.buildMessages(prompt, previousImageUrl);
        if (character) {
          character.publicImageUrl = messages.publicImageUrl;
        }
        const res = await this.generate("character", messages.messages);
        if (res === undefined) {
          throw Error("Image result is undefined");
        }
        return res;
      },
      {
        retries: 3,
        minTimeout: 500,
      },
    );
  }

  async generateLocationImage(prompt: string): Promise<string | undefined> {
    return retry(
      async (attempt) => {
        console.log("Attempt generate location image", attempt);
        const messages = await this.buildMessages(prompt);
        const res = await this.generate("location", messages.messages);
        if (res === undefined) {
          throw Error("Image result is undefined");
        }
        return res;
      },
      {
        retries: 3,
        minTimeout: 500,
      },
    );
  }

  calculateEquipmentHash(equipment: Record<string, unknown>): string {
    return crypto
      .createHash("md5")
      .update(JSON.stringify(equipment ?? {}))
      .digest("hex");
  }
}

type PredictMessage = {
  role: string;
  content: PredictContent[];
};

type PredictContent =
  | OpenAI.Chat.ChatCompletionContentPartImage
  | OpenAI.Chat.ChatCompletionContentPart;
