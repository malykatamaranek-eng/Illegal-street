import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import sharp from 'sharp';
import logger from '../config/logger';
import { InternalServerError, ValidationError } from '../utils/errors';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

interface UploadResult {
  url: string;
  key: string;
  size: number;
}

class ImageService {
  private s3: AWS.S3 | null = null;
  private useS3: boolean;
  private uploadDir: string;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor() {
    this.useS3 = process.env.DEV_MOCK_S3 !== 'true' && !!process.env.AWS_ACCESS_KEY_ID;
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.maxFileSize = parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10); // 10MB
    this.allowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif').split(',');

    if (this.useS3) {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
      });
    } else {
      // Ensure upload directory exists
      this.ensureUploadDir();
    }
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        await mkdir(this.uploadDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Validate file
   */
  private validateFile(file: { size: number; mimetype: string }): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new ValidationError(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new ValidationError(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Generate unique filename
   */
  private generateFileName(originalName: string, folder: string = ''): string {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const fileName = `${folder ? folder + '/' : ''}${timestamp}-${hash}${ext}`;
    return fileName;
  }

  /**
   * Upload image to S3 or local storage
   */
  async uploadImage(file: { originalname: string; mimetype: string; buffer: Buffer; size: number }, folder: string = 'general'): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      const fileName = this.generateFileName(file.originalname, folder);

      if (this.useS3 && this.s3) {
        return await this.uploadToS3(file, fileName);
      } else {
        return await this.uploadToLocal(file, fileName);
      }
    } catch (error) {
      logger.error('Upload image error:', error);
      throw error;
    }
  }

  /**
   * Upload to S3
   */
  private async uploadToS3(file: { mimetype: string; buffer: Buffer; size: number }, key: string): Promise<UploadResult> {
    try {
      const bucket = process.env.AWS_S3_BUCKET || 'illegal-street-uploads';

      const params: AWS.S3.PutObjectRequest = {
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      };

      const result = await this.s3!.upload(params).promise();

      logger.info(`File uploaded to S3: ${key}`);

      return {
        url: result.Location,
        key: result.Key,
        size: file.size,
      };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new InternalServerError('Failed to upload file to S3');
    }
  }

  /**
   * Upload to local storage
   */
  private async uploadToLocal(file: { buffer: Buffer; size: number }, fileName: string): Promise<UploadResult> {
    try {
      await this.ensureUploadDir();

      const filePath = path.join(this.uploadDir, fileName);
      const fileDir = path.dirname(filePath);

      // Create subdirectory if it doesn't exist
      if (!fs.existsSync(fileDir)) {
        await mkdir(fileDir, { recursive: true });
      }

      // Write file
      await writeFile(filePath, file.buffer);

      logger.info(`File uploaded to local storage: ${fileName}`);

      const url = `${process.env.APP_URL}/uploads/${fileName}`;

      return {
        url,
        key: fileName,
        size: file.size,
      };
    } catch (error) {
      logger.error('Local upload error:', error);
      throw new InternalServerError('Failed to upload file to local storage');
    }
  }

  /**
   * Delete image
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      if (this.useS3 && this.s3) {
        await this.deleteFromS3(imageUrl);
      } else {
        await this.deleteFromLocal(imageUrl);
      }
    } catch (error) {
      logger.error('Delete image error:', error);
      throw error;
    }
  }

  /**
   * Delete from S3
   */
  private async deleteFromS3(imageUrl: string): Promise<void> {
    try {
      const bucket = process.env.AWS_S3_BUCKET || 'illegal-street-uploads';
      const key = imageUrl.split('/').pop() || '';

      await this.s3!.deleteObject({
        Bucket: bucket,
        Key: key,
      }).promise();

      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new InternalServerError('Failed to delete file from S3');
    }
  }

  /**
   * Delete from local storage
   */
  private async deleteFromLocal(imageUrl: string): Promise<void> {
    try {
      const fileName = imageUrl.split('/uploads/').pop() || '';
      const filePath = path.join(this.uploadDir, fileName);

      if (fs.existsSync(filePath)) {
        await unlink(filePath);
        logger.info(`File deleted from local storage: ${fileName}`);
      }
    } catch (error) {
      logger.error('Local delete error:', error);
      throw new InternalServerError('Failed to delete file from local storage');
    }
  }

  /**
   * Get image URL
   */
  getImageUrl(key: string): string {
    if (this.useS3) {
      const bucket = process.env.AWS_S3_BUCKET || 'illegal-street-uploads';
      const region = process.env.AWS_REGION || 'us-east-1';
      return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    } else {
      return `${process.env.APP_URL}/uploads/${key}`;
    }
  }

  /**
   * Resize image using sharp library
   */
  async resizeImage(buffer: Buffer, width: number, height: number): Promise<Buffer> {
    try {
      const resizedBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();

      logger.info(`Image resized to ${width}x${height}`);
      return resizedBuffer;
    } catch (error) {
      logger.error('Resize image error:', error);
      throw new InternalServerError('Failed to resize image');
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultiple(
    files: { originalname: string; mimetype: string; buffer: Buffer; size: number }[],
    folder: string = 'general'
  ): Promise<UploadResult[]> {
    try {
      const results = await Promise.all(
        files.map((file) => this.uploadImage(file, folder))
      );

      return results;
    } catch (error) {
      logger.error('Upload multiple images error:', error);
      throw error;
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(): Promise<{
    total_size: number;
    total_files: number;
    storage_type: string;
  }> {
    try {
      if (this.useS3 && this.s3) {
        // For S3, we'd need to list all objects and sum sizes
        // This is expensive, so we'll return a placeholder
        return {
          total_size: 0,
          total_files: 0,
          storage_type: 'S3',
        };
      } else {
        // For local storage, count files and sizes
        let totalSize = 0;
        let totalFiles = 0;

        const countFiles = (dir: string) => {
          const files = fs.readdirSync(dir);
          files.forEach((file) => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              countFiles(filePath);
            } else {
              totalSize += stat.size;
              totalFiles++;
            }
          });
        };

        if (fs.existsSync(this.uploadDir)) {
          countFiles(this.uploadDir);
        }

        return {
          total_size: totalSize,
          total_files: totalFiles,
          storage_type: 'Local',
        };
      }
    } catch (error) {
      logger.error('Get upload stats error:', error);
      throw error;
    }
  }
}

export default new ImageService();
