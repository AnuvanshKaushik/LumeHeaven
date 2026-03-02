import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";

const ManagerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/orders");
      setOrders(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
      toast.success("Order status updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const counts = useMemo(() => {
    const pending = orders.filter((order) => order.status === "Pending").length;
    const shipped = orders.filter((order) => order.status === "Shipped").length;
    const delivered = orders.filter((order) => order.status === "Delivered").length;
    return { pending, shipped, delivered };
  }, [orders]);

  if (loading) return <Loader text="Loading customer orders..." />;

  return (
    <main className="page-wrap">
      <section className="analytics-grid">
        <article className="glass stat-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </article>
        <article className="glass stat-card">
          <span>Pending</span>
          <strong>{counts.pending}</strong>
        </article>
        <article className="glass stat-card">
          <span>Shipped</span>
          <strong>{counts.shipped}</strong>
        </article>
        <article className="glass stat-card">
          <span>Delivered</span>
          <strong>{counts.delivered}</strong>
        </article>
      </section>

      <section className="section-wrap glass">
        <h1>Customer Orders</h1>
        <div className="order-list">
          {orders.map((order) => (
            <article key={order._id} className="order-card order-card-rich">
              <div>
                <h3>{order.orderId}</h3>
                <p>
                  Customer: {order.customer?.name} ({order.customer?.email})
                </p>
                <p>Total: Rs.{order.total.toLocaleString()}</p>
                <p>Placed: {new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <select className="animated-dropdown" value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)}>
                <option value="Pending">Pending</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default ManagerOrdersPage;
