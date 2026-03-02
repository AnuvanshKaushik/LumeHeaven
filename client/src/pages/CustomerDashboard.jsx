import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CustomerDashboard = () => {
  return (
    <main className="page-wrap">
      <motion.section className="section-wrap glass" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Customer Dashboard</h1>
        <p>Manage your shopping journey from one place.</p>
        <div className="quick-links">
          <Link className="btn btn-primary ripple" to="/products">Browse Products</Link>
          <Link className="btn btn-light ripple" to="/wishlist">Wishlist</Link>
          <Link className="btn btn-light ripple" to="/cart">Cart</Link>
          <Link className="btn btn-light ripple" to="/orders">Order History</Link>
          <Link className="btn btn-light ripple" to="/profile">Profile</Link>
        </div>
      </motion.section>
    </main>
  );
};

export default CustomerDashboard;
