import { Router } from "express";
import {
  getProfile,
  getWishlist,
  toggleWishlist,
  updateProfile,
} from "../controllers/userController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, authorizeRoles("customer"));
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/wishlist", getWishlist);
router.post("/wishlist/toggle", toggleWishlist);

export default router;
