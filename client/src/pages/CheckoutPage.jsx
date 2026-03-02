import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";

const CheckoutPage = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const couponCode = location.state?.coupon || "";

  useEffect(() => {
    const load = async () => {
      try {
        const [cartRes, profileRes] = await Promise.all([api.get("/cart"), api.get("/users/profile")]);
        setCart(cartRes.data);
        const profile = profileRes.data;
        setForm((prev) => ({
          ...prev,
          name: profile.name || "",
          phone: profile.phone || "",
          ...profile.address,
        }));
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load checkout");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const deliveryCharge = subtotal > 999 ? 0 : 99;
    const normalized = couponCode.trim().toUpperCase();
    const discount = normalized === "LUXE10" ? Math.round(subtotal * 0.1) : 0;
    const total = Math.max(0, subtotal + deliveryCharge - discount);
    return { subtotal, deliveryCharge, discount, total };
  }, [cart, couponCode]);

  const placeOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);

    try {
      const { data } = await api.post("/orders", {
        shippingAddress: form,
        paymentMethod,
        couponCode,
      });
      toast.success("Order placed successfully");
      if (data?.email?.status === "sent") {
        toast.success(data?.email?.message || "Order confirmation email sent");
      }
      if (data?.email?.status === "failed" || data?.email?.status === "skipped") {
        toast.error(data?.email?.message || "Order confirmation email could not be sent");
      }
      navigate(`/orders?created=${data.orderId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Checkout failed");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Loader text="Preparing checkout..." />;

  return (
    <main className="page-wrap">
      <section className="checkout-layout">
        <form className="glass form-grid checkout-form" onSubmit={placeOrder}>
          <h1>Shipping Details</h1>
          <div className="form-2col">
            <input required placeholder="Full name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
          </div>
          <input required placeholder="Address line" value={form.line1} onChange={(e) => setForm((s) => ({ ...s, line1: e.target.value }))} />
          <div className="form-2col">
            <input required placeholder="City" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
            <input required placeholder="State" value={form.state} onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))} />
          </div>
          <div className="form-2col">
            <input required placeholder="Postal code" value={form.postalCode} onChange={(e) => setForm((s) => ({ ...s, postalCode: e.target.value }))} />
            <input required placeholder="Country" value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} />
          </div>

          <label>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cod">Cash on Delivery</option>
            <option value="card">Card (Simulation)</option>
            <option value="upi">UPI (Simulation)</option>
          </select>

          <button className="btn btn-primary ripple" disabled={placing || !cart.length} type="submit">
            {placing ? "Placing Order..." : "Place Order"}
          </button>
        </form>

        <aside className="glass order-summary sticky-summary">
          <h2>Order Summary</h2>
          <div className="summary-list">
            {cart.map((item) => (
              <p key={item.product._id}>
                {item.product.name} x {item.quantity}
              </p>
            ))}
          </div>
          <hr />
          <p>Subtotal: Rs.{summary.subtotal.toLocaleString()}</p>
          <p>Delivery: Rs.{summary.deliveryCharge.toLocaleString()}</p>
          <p>Discount: Rs.{summary.discount.toLocaleString()}</p>
          <h3>Total: Rs.{summary.total.toLocaleString()}</h3>
        </aside>
      </section>
    </main>
  );
};

export default CheckoutPage;
