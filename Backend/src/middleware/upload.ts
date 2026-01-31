import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../utils/errors';

// Upload directory
const uploadDir = process.env.UPLOAD_DIR || 'uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Maximum file size (5MB default)
const maxFileSize = parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10);

// Allowed file types
const allowedMimeTypes = process.env.UPLOAD_ALLOWED_TYPES
  ? process.env.UPLOAD_ALLOWED_TYPES.split(',')
  : [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

// File filter to validate file types
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  // Check if file type is allowed
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new ValidationError(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
      )
    );
  }
};

// Disk storage configuration
const diskStorage: StorageEngine = multer.diskStorage({
  destination: (_req, file, callback) => {
    // Create subdirectories based on file type
    let subDir = 'others';
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype === 'application/pdf') {
      subDir = 'documents';
    }

    const fullPath = path.join(uploadDir, subDir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    callback(null, fullPath);
  },
  filename: (_req, file, callback) => {
    // Generate unique filename
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueId}${ext}`;
    callback(null, filename);
  },
});

// Memory storage configuration (for cloud uploads)
const memoryStorage: StorageEngine = multer.memoryStorage();

// Create multer instance with disk storage
const uploadDisk = multer({
  storage: diskStorage,
  limits: {
    fileSize: maxFileSize,
    files: 10, // Maximum 10 files per request
  },
  fileFilter,
});

// Create multer instance with memory storage
const uploadMemory = multer({
  storage: memoryStorage,
  limits: {
    fileSize: maxFileSize,
    files: 10,
  },
  fileFilter,
});

// Upload single file (disk storage)
export const uploadSingle = (fieldName: string = 'file') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    uploadDisk.single(fieldName)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ValidationError(
              `File too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`
            )
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new ValidationError(`Unexpected field name. Expected: ${fieldName}`)
          );
        }
        return next(new ValidationError(`Upload error: ${err.message}`));
      }
      if (err) {
        return next(err);
      }

      // Validate file was uploaded
      if (!req.file) {
        return next(new ValidationError('No file uploaded'));
      }

      next();
    });
  };
};

// Upload multiple files (disk storage)
export const uploadMultiple = (
  fieldName: string = 'files',
  maxCount: number = 5
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    uploadDisk.array(fieldName, maxCount)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ValidationError(
              `File too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`
            )
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(
            new ValidationError(`Too many files. Maximum: ${maxCount}`)
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new ValidationError(`Unexpected field name. Expected: ${fieldName}`)
          );
        }
        return next(new ValidationError(`Upload error: ${err.message}`));
      }
      if (err) {
        return next(err);
      }

      // Validate files were uploaded
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        return next(new ValidationError('No files uploaded'));
      }

      next();
    });
  };
};

// Upload single file (memory storage for cloud)
export const uploadSingleMemory = (fieldName: string = 'file') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    uploadMemory.single(fieldName)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ValidationError(
              `File too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`
            )
          );
        }
        return next(new ValidationError(`Upload error: ${err.message}`));
      }
      if (err) {
        return next(err);
      }

      if (!req.file) {
        return next(new ValidationError('No file uploaded'));
      }

      next();
    });
  };
};

// Upload multiple files (memory storage for cloud)
export const uploadMultipleMemory = (
  fieldName: string = 'files',
  maxCount: number = 5
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    uploadMemory.array(fieldName, maxCount)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ValidationError(
              `File too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`
            )
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(
            new ValidationError(`Too many files. Maximum: ${maxCount}`)
          );
        }
        return next(new ValidationError(`Upload error: ${err.message}`));
      }
      if (err) {
        return next(err);
      }

      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        return next(new ValidationError('No files uploaded'));
      }

      next();
    });
  };
};

// Image-only validation
export const validateImageOnly = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (req.file) {
    if (!imageTypes.includes(req.file.mimetype)) {
      return next(
        new ValidationError('Only image files are allowed (JPEG, PNG, GIF, WebP)')
      );
    }
  }

  if (req.files && Array.isArray(req.files)) {
    const invalidFiles = req.files.filter(
      (file) => !imageTypes.includes(file.mimetype)
    );
    if (invalidFiles.length > 0) {
      return next(
        new ValidationError('Only image files are allowed (JPEG, PNG, GIF, WebP)')
      );
    }
  }

  next();
};

// Clean up uploaded files on error
export const cleanupUploadOnError = (
  err: any,
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Delete uploaded file(s) if there's an error
  if (req.file && req.file.path) {
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Error deleting file:', unlinkErr);
      }
    });
  }

  if (req.files && Array.isArray(req.files)) {
    req.files.forEach((file) => {
      if (file.path) {
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting file:', unlinkErr);
          }
        });
      }
    });
  }

  next(err);
};

// Delete file helper
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
