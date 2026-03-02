import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";

const ManagerAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/orders/analytics/overview");
        setData(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <Loader text="Loading sales analytics..." />;
  if (!data) return null;

  return (
    <main className="page-wrap">
      <section className="analytics-grid">
        <article className="glass stat-card">
          <span>Total Revenue</span>
          <strong>Rs.{Math.round(data.totalRevenue).toLocaleString()}</strong>
        </article>
        <article className="glass stat-card">
          <span>Total Orders</span>
          <strong>{data.totalOrders}</strong>
        </article>
        <article className="glass stat-card">
          <span>Average Order Value</span>
          <strong>Rs.{Math.round(data.averageOrderValue).toLocaleString()}</strong>
        </article>
      </section>

      <section className="section-wrap glass">
        <h2>Order Status Split</h2>
        <div className="status-row">
          {data.statusCounts.map((item) => (
            <div key={item._id} className="status-pill">
              {item._id}: {item.count}
            </div>
          ))}
        </div>
      </section>

      <section className="section-wrap glass">
        <h2>Monthly Revenue Overview</h2>
        <div className="bar-chart">
          {data.monthlyRevenue.map((item) => (
            <div key={item._id} className="bar-item">
              <div className="bar" style={{ height: `${Math.min(220, Math.max(20, item.revenue / 100))}px` }} />
              <span>M{item._id}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default ManagerAnalyticsPage;
