import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "ru-7",
  endpoint: "https://s3.storage.selcloud.ru",
  credentials: {
    accessKeyId: process.env.S3_KEY || "52ea17f3613c4c4c835fe8739c050071",
    secretAccessKey:
      process.env.S3_SECRET || "8a1c360f0f634ca9a23d1f220504db2d",
  },
  forcePathStyle: false,
});

export async function uploadImageToS3(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | Blob | string,
  bucketKey: string,
  contentType: string = "image/png",
): Promise<string> {
  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: "public-read",
  };

  await s3.send(new PutObjectCommand(params));

  return `https://${bucketKey}.selstorage.ru/${encodeURIComponent(key)}`;
}
