import { Router } from "express";
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  getCategories,
  updateSubcategory,
  updateCategory,
} from "../controllers/categoryController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getCategories);
router.post("/", protect, authorizeRoles("manager"), createCategory);
router.put("/:id", protect, authorizeRoles("manager"), updateCategory);
router.delete("/:id", protect, authorizeRoles("manager"), deleteCategory);
router.post("/:id/subcategories", protect, authorizeRoles("manager"), createSubcategory);
router.put("/:id/subcategories/:subcategoryId", protect, authorizeRoles("manager"), updateSubcategory);
router.delete("/:id/subcategories/:subcategoryId", protect, authorizeRoles("manager"), deleteSubcategory);

export default router;
