import crypto from "crypto";
import multer from "multer";
import sharp from "sharp";
import { isCloudinaryReady, uploadBufferToCloudinary } from "../services/cloudinaryService.js";

const memoryStorage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

const optimizeImage = async (buffer) => {
  const pipeline = sharp(buffer).rotate();
  const metadata = await pipeline.metadata();
  const width = metadata.width ? Math.min(metadata.width, 1400) : 1400;
  const output = await pipeline
    .resize({ width, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 80 })
    .toBuffer();

  const optimizedMeta = await sharp(output).metadata();
  return {
    buffer: output,
    width: optimizedMeta.width || width,
    height: optimizedMeta.height || 1,
    size: output.length,
  };
};

export const uploadProductImages = async (req, res) => {
  try {
    if (!isCloudinaryReady()) {
      return res.status(500).json({ message: "Cloudinary is not configured on server" });
    }

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const savedImages = [];

    for (const file of files) {
      const optimized = await optimizeImage(file.buffer);
      const publicId = `${Date.now()}-${crypto.randomUUID()}`;
      const uploaded = await uploadBufferToCloudinary(optimized.buffer, {
        folder: "lumeheaven/products",
        format: "webp",
        public_id: publicId,
      });

      savedImages.push({
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        width: optimized.width,
        height: optimized.height,
        size: optimized.size,
      });
    }

    return res.status(201).json({ images: savedImages });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload images", error: error.message });
  }
};
