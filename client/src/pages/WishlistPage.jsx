import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";

const WishlistPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/users/wishlist");
      setItems(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (productId) => {
    try {
      await api.post("/users/wishlist/toggle", { productId });
      setItems((prev) => prev.filter((item) => item._id !== productId));
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update wishlist");
    }
  };

  if (loading) return <Loader text="Loading wishlist..." />;

  return (
    <main className="page-wrap">
      <section className="section-wrap glass">
        <h1>Wishlist</h1>
        {!items.length && <p>No saved jewellery yet. <Link to="/products">Explore products</Link></p>}
        <div className="product-grid">
          {items.map((item) => (
            <motion.article key={item._id} className="product-card glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <img src={item.images?.[0] || item.imageUrl} alt={item.name} loading="lazy" />
              <div className="card-body">
                <h3>{item.name}</h3>
                <p className="price">Rs.{item.price.toLocaleString()}</p>
              </div>
              <div className="card-actions">
                <Link className="btn btn-light ripple" to={`/products/${item._id}`}>View</Link>
                <button className="btn btn-danger ripple" onClick={() => remove(item._id)}>Remove</button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default WishlistPage;
