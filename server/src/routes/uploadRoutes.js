import { Router } from "express";
import { uploadMiddleware, uploadProductImages } from "../controllers/uploadController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post(
  "/products",
  protect,
  authorizeRoles("manager"),
  uploadMiddleware.array("images", 8),
  uploadProductImages
);

export default router;
