import Order from "../models/Order.js";
import User from "../models/User.js";
import { sendOrderConfirmationEmail } from "../services/mailService.js";

const createOrderCode = () => `LS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, couponCode = "" } = req.body;

    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.cart.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const subtotal = user.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const deliveryCharge = subtotal > 999 ? 0 : 99;
    const normalizedCoupon = couponCode.trim().toUpperCase();
    const discount = normalizedCoupon === "LUXE10" ? Math.round(subtotal * 0.1) : 0;
    const total = Math.max(0, subtotal + deliveryCharge - discount);

    const order = await Order.create({
      customer: user._id,
      orderId: createOrderCode(),
      items: user.cart.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        price: item.product.price,
        quantity: item.quantity,
      })),
      shippingAddress,
      paymentMethod,
      subtotal,
      deliveryCharge,
      discount,
      total,
      couponCode: normalizedCoupon,
    });

    user.cart = [];
    await user.save();

    let email = { status: "skipped", message: "Email transport not configured" };

    // Email is best-effort; order should still succeed if email provider is unavailable.
    try {
      const mailResult = await sendOrderConfirmationEmail({
        to: user.email,
        customerName: user.name,
        order,
      });

      email = mailResult?.sent
        ? { status: "sent", message: "Confirmation email sent successfully" }
        : { status: mailResult?.skipped ? "skipped" : "failed", message: mailResult?.message || "Order confirmation email failed" };
    } catch (emailError) {
      console.error("Order email failed:", emailError.message);
      email = { status: "failed", message: "Order placed, but confirmation email failed" };
    }

    return res.status(201).json({ ...order.toObject(), email });
  } catch (error) {
    return res.status(500).json({ message: "Failed to place order", error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

export const getAllOrders = async (_req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch all orders", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Pending", "Shipped", "Delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

export const getSalesAnalytics = async (_req, res) => {
  try {
    const [summary] = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$total" },
        },
      },
    ]);

    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const monthlyRevenue = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json({
      totalRevenue: summary?.totalRevenue || 0,
      totalOrders: summary?.totalOrders || 0,
      averageOrderValue: Math.round(summary?.averageOrderValue || 0),
      statusCounts,
      monthlyRevenue,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load analytics", error: error.message });
  }
};
