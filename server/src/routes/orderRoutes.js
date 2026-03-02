import { Router } from "express";
import {
  getAllOrders,
  getMyOrders,
  getSalesAnalytics,
  placeOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", protect, authorizeRoles("customer"), placeOrder);
router.get("/my", protect, authorizeRoles("customer"), getMyOrders);
router.get("/", protect, authorizeRoles("manager"), getAllOrders);
router.put("/:id/status", protect, authorizeRoles("manager"), updateOrderStatus);
router.get("/analytics/overview", protect, authorizeRoles("manager"), getSalesAnalytics);

export default router;
