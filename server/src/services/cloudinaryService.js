import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

const getCloudinaryCredentials = () => ({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET || "",
});

export const isCloudinaryReady = () => {
  const creds = getCloudinaryCredentials();
  return Boolean(creds.cloud_name && creds.api_key && creds.api_secret);
};

const configureCloudinary = () => {
  if (isConfigured) {
    return;
  }

  const creds = getCloudinaryCredentials();
  cloudinary.config({
    cloud_name: creds.cloud_name,
    api_key: creds.api_key,
    api_secret: creds.api_secret,
    secure: true,
  });
  isConfigured = true;
};

export const uploadBufferToCloudinary = (buffer, options = {}) => {
  if (!isCloudinaryReady()) {
    throw new Error("Cloudinary is not configured");
  }

  configureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "lumeheaven/products",
        resource_type: "image",
        format: options.format || "webp",
        public_id: options.public_id || undefined,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

export const extractPublicIdFromUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw.includes("res.cloudinary.com") || !raw.includes("/upload/")) {
    return "";
  }

  const uploadSplit = raw.split("/upload/");
  if (uploadSplit.length < 2) {
    return "";
  }

  const pathWithVersion = uploadSplit[1].split("?")[0];
  const withoutVersion = pathWithVersion.replace(/^v\d+\//, "");
  return withoutVersion.replace(/\.[^.]+$/, "");
};

export const collectCloudinaryPublicIds = ({ imageMeta = [], images = [] } = {}) => {
  const ids = new Set();

  imageMeta.forEach((meta) => {
    if (meta?.publicId) {
      ids.add(String(meta.publicId));
      return;
    }

    const parsed = extractPublicIdFromUrl(meta?.url || "");
    if (parsed) {
      ids.add(parsed);
    }
  });

  images.forEach((imageUrl) => {
    const parsed = extractPublicIdFromUrl(imageUrl);
    if (parsed) {
      ids.add(parsed);
    }
  });

  return Array.from(ids);
};

export const deleteCloudinaryImages = async (publicIds) => {
  const ids = (publicIds || []).filter(Boolean);
  if (!ids.length || !isCloudinaryReady()) {
    return;
  }

  configureCloudinary();
  await cloudinary.api.delete_resources(ids, {
    resource_type: "image",
    type: "upload",
  });
};
