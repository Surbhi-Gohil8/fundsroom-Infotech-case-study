import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import fs from 'fs';
import path from 'path';

// __dirname is natively available in CommonJS output

const localUploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

let s3Client: S3Client | null = null;
const isS3Configured = !!(
  env.AWS_ACCESS_KEY_ID &&
  env.AWS_SECRET_ACCESS_KEY &&
  env.AWS_S3_BUCKET
);

if (isS3Configured) {
  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  logger.info('AWS S3 storage backend initialized');
} else {
  logger.info('AWS S3 credentials not provided. Using local disk fallback for uploads');
}

export const uploadFile = async (
  file: Express.Multer.File
): Promise<string> => {
  const fileExt = path.extname(file.originalname);
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;

  if (s3Client && isS3Configured) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
      logger.error('Failed to upload file to S3, falling back to local storage', error);
    }
  }

  // Local storage fallback
  const filePath = path.join(localUploadDir, fileName);
  await fs.promises.writeFile(filePath, file.buffer);
  return `/uploads/${fileName}`;
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) return;

  if (fileUrl.includes('amazonaws.com') && s3Client && isS3Configured) {
    try {
      const key = fileUrl.split('/').pop();
      if (key) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: key,
          })
        );
        logger.info(`Deleted file from S3: ${key}`);
      }
    } catch (error) {
      logger.error('Failed to delete file from S3', error);
    }
    return;
  }

  // Local file delete
  if (fileUrl.startsWith('/uploads/')) {
    try {
      const fileName = fileUrl.replace('/uploads/', '');
      const filePath = path.join(localUploadDir, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info(`Deleted file from local storage: ${fileName}`);
      }
    } catch (error) {
      logger.error('Failed to delete local file', error);
    }
  }
};
