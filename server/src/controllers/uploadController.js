import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import multer from "multer";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.resolve(__dirname, "../../uploads/products");

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
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    await fs.mkdir(uploadDirectory, { recursive: true });
    const savedImages = [];
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    for (const file of files) {
      const optimized = await optimizeImage(file.buffer);
      const fileName = `${Date.now()}-${crypto.randomUUID()}.webp`;
      const absolutePath = path.join(uploadDirectory, fileName);
      await fs.writeFile(absolutePath, optimized.buffer);

      savedImages.push({
        url: `${baseUrl}/uploads/products/${fileName}`,
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
