import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { sendOrderConfirmationEmail } from "../services/mailService.js";

const createOrderCode = () => `LS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionCommitted = false;
  try {
    session.startTransaction();

    const fail = (status, message) => {
      const error = new Error(message);
      error.status = status;
      throw error;
    };

    const { shippingAddress, paymentMethod, couponCode = "" } = req.body;

    const user = await User.findById(req.user.id).populate("cart.product").session(session);
    if (!user) {
      fail(404, "User not found");
    }

    if (!user.cart.length) {
      fail(400, "Cart is empty");
    }

    const hasUnavailableItem = user.cart.some((item) => !item.product?._id);
    if (hasUnavailableItem) {
      fail(400, "Some products in your cart are unavailable. Please update your cart and try again.");
    }

    for (const item of user.cart) {
      if (item.quantity > item.product.stock) {
        fail(400, `${item.product.name} has only ${item.product.stock} unit(s) left in stock`);
      }
    }

    const subtotal = user.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const deliveryCharge = subtotal > 999 ? 0 : 99;
    const normalizedCoupon = couponCode.trim().toUpperCase();
    const discount = normalizedCoupon === "LUXE10" ? Math.round(subtotal * 0.1) : 0;
    const total = Math.max(0, subtotal + deliveryCharge - discount);

    for (const item of user.cart) {
      const updateResult = await Product.updateOne(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session }
      );
      if (updateResult.modifiedCount !== 1) {
        fail(400, `${item.product.name} is out of stock. Please refresh and try again.`);
      }
    }

    const [order] = await Order.create([{
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
    }], { session });

    user.cart = [];
    await user.save({ session });
    await session.commitTransaction();
    transactionCommitted = true;

    // Return success immediately so checkout is never blocked by email delivery.
    const responsePayload = {
      ...order.toObject(),
      email: {
        status: "queued",
        message: "Order placed successfully. Confirmation email will be attempted in background.",
      },
    };
    res.status(201).json(responsePayload);

    // Best-effort async email notification after response.
    setImmediate(async () => {
      try {
        const mailResult = await sendOrderConfirmationEmail({
          to: user.email,
          customerName: user.name,
          order,
        });

        if (mailResult?.sent) {
          console.log(`Order email sent: orderId=${order.orderId}, to=${user.email}`);
          return;
        }

        console.warn(
          `Order email not sent: orderId=${order.orderId}, reason=${mailResult?.message || "unknown"}`
        );
      } catch (emailError) {
        console.error(`Order email failed: orderId=${order.orderId}`, emailError.message);
      }
    });

    return;
  } catch (error) {
    if (!transactionCommitted) {
      await session.abortTransaction();
    }
    const status = error?.status || 500;
    return res.status(status).json({ message: status === 500 ? "Failed to place order" : error.message, error: error.message });
  } finally {
    session.endSession();
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
