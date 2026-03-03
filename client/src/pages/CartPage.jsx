import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";

const CartPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [pendingQtyByProduct, setPendingQtyByProduct] = useState({});
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get("/cart");
      setItems(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateQty = async (productId, quantity) => {
    const nextQty = Math.max(1, Number(quantity));
    const previousItems = items;

    // Optimistic UI update so quantity buttons feel instant.
    setItems((prev) =>
      prev.map((entry) =>
        entry.product._id === productId ? { ...entry, quantity: nextQty } : entry
      )
    );
    setPendingQtyByProduct((prev) => ({ ...prev, [productId]: true }));

    try {
      const { data } = await api.put("/cart", { productId, quantity: nextQty });
      setItems(data);
    } catch (error) {
      setItems(previousItems);
      toast.error(error?.response?.data?.message || "Failed to update quantity");
    } finally {
      setPendingQtyByProduct((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  };

  const removeItem = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`);
      setItems(data);
      toast.success("Removed from cart");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove item");
    }
  };

  const { subtotal, deliveryCharge, discount, total } = useMemo(() => {
    const sub = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const delivery = sub > 999 ? 0 : 99;
    const disc = coupon.trim().toUpperCase() === "LUXE10" ? Math.round(sub * 0.1) : 0;
    return { subtotal: sub, deliveryCharge: delivery, discount: disc, total: Math.max(0, sub + delivery - disc) };
  }, [items, coupon]);

  if (loading) return <Loader text="Loading your cart..." />;

  return (
    <main className="page-wrap">
      <section className="cart-layout">
        <div className="glass cart-list">
          <h1>Your Cart</h1>
          {!items.length && (
            <p>
              Cart is empty. <Link to="/products">Start shopping</Link>
            </p>
          )}
          <AnimatePresence>
            {items.map((item) => (
              <motion.article
                key={item.product._id}
                className="cart-item"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.22 }}
              >
                <img src={item.product.images?.[0] || item.product.imageUrl} alt={item.product.name} loading="lazy" />
                <div>
                  <h3>{item.product.name}</h3>
                  <p>Rs.{item.product.price.toLocaleString()}</p>
                </div>
                <div className="qty-row">
                  <button
                    className="ripple"
                    disabled={Boolean(pendingQtyByProduct[item.product._id])}
                    onClick={() => updateQty(item.product._id, Math.max(1, item.quantity - 1))}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="ripple"
                    disabled={Boolean(pendingQtyByProduct[item.product._id])}
                    onClick={() => updateQty(item.product._id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button className="btn btn-danger ripple" onClick={() => removeItem(item.product._id)}>
                  Remove
                </button>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        <aside className="glass order-summary sticky-summary">
          <h2>Summary</h2>
          <p>Subtotal: Rs.{subtotal.toLocaleString()}</p>
          <p>Delivery: Rs.{deliveryCharge.toLocaleString()}</p>
          <p>Discount: Rs.{discount.toLocaleString()}</p>
          <label>Coupon</label>
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Use LUXE10" />
          <h3>Total: Rs.{total.toLocaleString()}</h3>
          <button
            className="btn btn-primary ripple"
            disabled={!items.length}
            onClick={() => navigate("/checkout", { state: { coupon } })}
          >
            Proceed to Checkout
          </button>
        </aside>
      </section>
    </main>
  );
};

export default CartPage;
