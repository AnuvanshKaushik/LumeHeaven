import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const created = searchParams.get("created");
    if (created) {
      toast.success(`Order confirmed: ${created}`);
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/orders/my");
        setOrders(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <Loader text="Loading order history..." />;

  return (
    <main className="page-wrap">
      <section className="section-wrap glass">
        <h1>Your Orders</h1>
        {!orders.length && <p>No orders yet.</p>}
        <div className="order-list">
          {orders.map((order) => (
            <article key={order._id} className="order-card">
              <h3>{order.orderId}</h3>
              <p>Status: {order.status}</p>
              <p>Total: Rs.{order.total.toLocaleString()}</p>
              <p>Placed on: {new Date(order.createdAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default OrderHistoryPage;
