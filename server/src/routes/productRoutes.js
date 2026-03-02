import { Router } from "express";
import {
  addReview,
  createProduct,
  deleteProduct,
  getProductById,
  getProductsByCategory,
  getProducts,
  updateProduct,
} from "../controllers/productController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/:id", getProductById);
router.post("/:id/reviews", protect, authorizeRoles("customer"), addReview);
router.post("/", protect, authorizeRoles("manager"), createProduct);
router.put("/:id", protect, authorizeRoles("manager"), updateProduct);
router.delete("/:id", protect, authorizeRoles("manager"), deleteProduct);

export default router;
