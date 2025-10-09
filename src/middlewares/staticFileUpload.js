// middlewares/staticFileUpload.js
import multer from 'multer';
import path from 'path';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for video allowance

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const allowedVideoExts = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.flv', '.mkv'];

    if (allowedImageExts.includes(ext) || allowedVideoExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed'));
    }
};

const fileUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
}).single('file');  // Expecting field named 'file' for topic video/image upload

export default fileUpload;
