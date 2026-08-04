import multer from 'multer';
import { AppError } from '../errors/AppError.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, and WEBP are allowed.', 400), false);
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

// 1. Deep Buffer Inspection Function
const validateFileIntegrity = (file) => {
  if (!file.buffer || file.buffer.length < 4) return false;
  
  const ext = file.originalname.split('.').pop().toLowerCase();
  const hex = file.buffer.toString('hex', 0, 4).toUpperCase();
  
  switch (file.mimetype) {
    case 'image/jpeg':
      return hex.startsWith('FFD8FF') && ['jpg', 'jpeg'].includes(ext);
    case 'image/png':
      return hex === '89504E47' && ext === 'png';
    case 'image/webp':
      if (hex !== '52494646') return false; // RIFF
      const format = file.buffer.toString('ascii', 8, 12);
      return format === 'WEBP' && ext === 'webp';
    default:
      return false;
  }
};

// 2. Interceptor Middleware
const securityInterceptor = (req, res, next) => {
  let files = [];
  
  if (req.files) {
    if (Array.isArray(req.files)) {
      files = req.files;
    } else {
      files = Object.values(req.files).flat();
    }
  } else if (req.file) {
    files = [req.file];
  }
  
  for (const file of files) {
    if (!validateFileIntegrity(file)) {
      return next(new AppError(`File upload rejected: ${file.originalname} is disguised, malformed, or has a mismatched extension.`, 400));
    }
  }
  next();
};

// 3. Proxy Wrapper
export const upload = {
  fields: (fields) => [multerUpload.fields(fields), securityInterceptor],
  single: (field) => [multerUpload.single(field), securityInterceptor],
  array: (field, maxCount) => [multerUpload.array(field, maxCount), securityInterceptor]
};
