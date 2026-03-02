import User from "../models/User.js";

const populateCart = (query) =>
  query.populate({
    path: "cart.product",
    populate: { path: "category", select: "name slug" },
  });

export const getCart = async (req, res) => {
  try {
    const user = await populateCart(User.findById(req.user.id));
    return res.json(user?.cart || []);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch cart", error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const index = user.cart.findIndex((item) => item.product.toString() === productId);
    if (index >= 0) {
      user.cart[index].quantity += Number(quantity);
    } else {
      user.cart.push({ product: productId, quantity: Number(quantity) });
    }

    await user.save();

    const hydrated = await populateCart(User.findById(req.user.id));
    return res.json(hydrated.cart);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add to cart", error: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: "productId and quantity are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const item = user.cart.find((entry) => entry.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    item.quantity = Math.max(1, Number(quantity));
    await user.save();

    const hydrated = await populateCart(User.findById(req.user.id));
    return res.json(hydrated.cart);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update cart", error: error.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = user.cart.filter((entry) => entry.product.toString() !== productId);
    await user.save();

    const hydrated = await populateCart(User.findById(req.user.id));
    return res.json(hydrated.cart);
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove cart item", error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { cart: [] });
    return res.json({ message: "Cart cleared" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to clear cart", error: error.message });
  }
};
