import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";

const renderStars = (rating) =>
  "★★★★★".split("").map((char, index) => (
    <span key={`${char}-${index}`} className={index < Math.round(Number(rating || 0)) ? "star filled" : "star"}>
      {char}
    </span>
  ));

const ProductDetailsPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [selectedImage, setSelectedImage] = useState("");
  const [zoomedImage, setZoomedImage] = useState("");

  const productImages = useMemo(() => {
    if (!product) return [];
    if (product.images?.length) return product.images;
    return product.imageUrl ? [product.imageUrl] : [];
  }, [product]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        const firstImage = data.images?.[0] || data.imageUrl || "";
        setSelectedImage(firstImage);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to fetch product");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const addToCart = async () => {
    try {
      await api.post("/cart", { productId: id, quantity: 1 });
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Please login as customer");
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/products/${id}/reviews`, review);
      toast.success("Review submitted");
      setReview({ rating: 5, comment: "" });
      const refreshed = await api.get(`/products/${id}`);
      setProduct(refreshed.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit review");
    }
  };

  if (loading) return <Loader text="Loading product..." />;
  if (!product) return <div className="page-wrap">Product not found.</div>;

  return (
    <main className="page-wrap">
      <section className="product-detail glass">
        <div>
          <img
            src={selectedImage || productImages[0]}
            alt={product.name}
            className="detail-image"
            onClick={() => setZoomedImage(selectedImage || productImages[0])}
          />
          {productImages.length > 1 && (
            <div className="detail-thumbs">
              {productImages.map((image) => (
                <button
                  key={image}
                  type="button"
                  className={`thumb-btn ${selectedImage === image ? "active" : ""}`}
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt={product.name} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1>{product.name}</h1>
          <div className="price-row">
            <p className="price">Rs.{Number(product.price).toLocaleString()}</p>
            <span className="strike-price">Rs.{Math.round(Number(product.price) * 1.14).toLocaleString()}</span>
          </div>
          <div className="rating-row">{renderStars(product.rating)}</div>
          <p>{product.description}</p>
          <p>
            Category: {product.category?.name || "Uncategorized"}
            {product.subcategoryDetails?.name ? ` / ${product.subcategoryDetails.name}` : ""}
          </p>
          <p>{product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}</p>
          <p>Rating: {Number(product.rating || 0).toFixed(1)} / 5 ({product.numReviews} reviews)</p>
          <button className="btn btn-primary" onClick={addToCart}>
            Add to Cart
          </button>
        </div>
      </section>

      <section className="section-wrap glass">
        <h2>Reviews & Ratings</h2>
        <form className="form-grid" onSubmit={submitReview}>
          <select value={review.rating} onChange={(event) => setReview((prev) => ({ ...prev, rating: Number(event.target.value) }))}>
            {[5, 4, 3, 2, 1].map((ratingValue) => (
              <option key={ratingValue} value={ratingValue}>
                {ratingValue} Star
              </option>
            ))}
          </select>
          <textarea
            rows={3}
            placeholder="Write your review"
            value={review.comment}
            onChange={(event) => setReview((prev) => ({ ...prev, comment: event.target.value }))}
          />
          <button className="btn btn-primary" type="submit">
            Submit Review
          </button>
        </form>
        <div className="review-list">
          {(product.reviews || []).map((item) => (
            <article key={item._id} className="review-item">
              <strong>{item.name}</strong>
              <span>{item.rating}/5</span>
              <p>{item.comment}</p>
            </article>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            className="image-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage("")}
          >
            <motion.div
              className="image-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <img src={zoomedImage} alt={`${product.name} preview`} />
              <button className="btn btn-light" onClick={() => setZoomedImage("")}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ProductDetailsPage;
