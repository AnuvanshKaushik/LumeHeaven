import { motion } from "framer-motion";

const ProductCard = ({ product, managerActions, onAddToCart }) => {
  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
    >
      <img src={product.imageUrl} alt={product.name} />
      <div className="card-body">
        <h3>{product.name}</h3>
        <p className="price">${Number(product.price).toFixed(2)}</p>
        <p>{product.description}</p>
      </div>

      <div className="card-actions">
        {managerActions ? (
          <>
            <button className="btn btn-light" onClick={() => managerActions.onEdit(product)}>
              Edit
            </button>
            <button className="btn btn-danger" onClick={() => managerActions.onDelete(product._id)}>
              Delete
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => onAddToCart(product)}>
            Add to cart
          </button>
        )}
      </div>
    </motion.article>
  );
};

export default ProductCard;
