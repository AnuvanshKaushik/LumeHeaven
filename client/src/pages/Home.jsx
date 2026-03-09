import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";
import NewsletterForm from "../components/NewsletterForm";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

const getSoldUnits = (product) =>
  Number(product?.soldCount ?? product?.totalSold ?? product?.unitsSold ?? product?.salesCount ?? 0);

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([api.get("/categories"), api.get("/products")]);
        setCategories(categoriesRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load homepage");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const featured = useMemo(() => products.slice(0, 8), [products]);
  const bestSellers = useMemo(
    () =>
      [...products]
        .sort((a, b) => {
          const salesDifference = getSoldUnits(b) - getSoldUnits(a);
          if (salesDifference !== 0) return salesDifference;

          const ratingDifference = Number(b.rating || 0) - Number(a.rating || 0);
          if (ratingDifference !== 0) return ratingDifference;

          return Number(b.numReviews || 0) - Number(a.numReviews || 0);
        })
        .slice(0, 4),
    [products]
  );

  if (loading) {
    return (
      <main className="landing">
        <Loader text="Designing your luxury storefront..." />
      </main>
    );
  }

  return (
    <main className="landing">
      <section className="hero-banner glass">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <p className="hero-tag">Premium Jewellery Boutique</p>
          <h1>Luxury Pieces That Elevate Every Moment</h1>
          <p>
            Discover curated collections crafted for modern elegance. Built for gifting, styling, and everyday sophistication.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary ripple" to="/products">
              Explore Collection
            </Link>
            <Link className="btn btn-light ripple" to="/customer-auth">
              Join Now
            </Link>
          </div>
        </motion.div>
      </section>

      <motion.section
        className="section-wrap"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <h2>Shop by Category</h2>
        <div className="category-grid">
          {categories.map((category) => (
            <motion.article key={category._id} variants={fadeUp} className="glass category-tile category-visual">
              <h3>{category.name}</h3>
              <p>{category.description || "Curated handcrafted selection."}</p>
              <Link className="category-link" to={`/products?category=${category.slug}`}>
                View Collection
              </Link>
              <div className="subcategory-pill-row">
                {(category.subcategories || []).slice(0, 3).map((sub) => (
                  <Link
                    key={sub._id}
                    className="status-pill"
                    to={`/products?category=${category.slug}&subcategory=${sub.slug}`}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="section-wrap"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <h2>Featured Products</h2>
        <div className="product-grid">
          {featured.map((product) => (
            <motion.article key={product._id} className="product-card glass" variants={fadeUp}>
              <Link to={`/products/${product._id}`}>
                <img src={product.images?.[0] || product.imageUrl} alt={product.name} loading="lazy" />
              </Link>
              <span className="badge-discount">Featured</span>
              <div className="card-body">
                <h3>{product.name}</h3>
                <p className="price">Rs.{Number(product.price).toLocaleString()}</p>
                <small>{product.category?.name || "Luxury Collection"}</small>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="section-wrap glass"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <h2>Best Sellers</h2>
        <div className="trend-grid">
          {bestSellers.map((item) => (
            <motion.article key={item._id} className="trend-card product-spotlight" variants={fadeUp}>
              <img src={item.images?.[0] || item.imageUrl} alt={item.name} loading="lazy" />
              <div>
                <h3>{item.name}</h3>
                <p className="price">Rs.{Number(item.price).toLocaleString()}</p>
                <p>{getSoldUnits(item)} sold</p>
                <p>{Number(item.rating || 0).toFixed(1)} / 5 rated</p>
                <Link className="btn btn-light btn-sm ripple" to={`/products/${item._id}`}>
                  Quick Shop
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <section className="section-wrap glass newsletter-block">
        <h2>Join the LUMEHEAVEN Circle</h2>
        <p>Get priority access to launches, offers, and styling notes.</p>
        <NewsletterForm placeholder="Enter your email" />
      </section>
    </main>
  );
};

export default Home;
