import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

const defaultFilters = {
  search: "",
  category: "",
  subcategory: "",
  minPrice: 0,
  maxPrice: 50000,
  sort: "newest",
};

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?._id || seen.has(item._id)) {
      return false;
    }
    seen.add(item._id);
    return true;
  });
};

const buildFiltersFromParams = (searchParams) => ({
  ...defaultFilters,
  category: searchParams.get("category") || "",
  subcategory: searchParams.get("subcategory") || searchParams.get("subCategory") || "",
});

const starRow = (rating) => {
  const rounded = Math.round(Number(rating || 0));
  return "★★★★★".split("").map((char, index) => (
    <span key={`${char}-${index}`} className={index < rounded ? "star filled" : "star"}>
      {char}
    </span>
  ));
};

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => buildFiltersFromParams(searchParams));
  const [emptyMessage, setEmptyMessage] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [addingProductId, setAddingProductId] = useState("");
  const requestCounterRef = useRef(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const selected = buildFiltersFromParams(searchParams);
    setFilters((prev) => {
      if (prev.category === selected.category && prev.subcategory === selected.subcategory) {
        return prev;
      }

      return {
        ...prev,
        category: selected.category,
        subcategory: selected.subcategory,
      };
    });
  }, [searchParams]);

  const loadCategories = async () => {
    const { data } = await api.get("/categories");
    setCategories(data);
  };

  const loadProducts = async (activeFilters) => {
    const requestId = ++requestCounterRef.current;
    try {
      setLoading(true);
      setProducts([]);
      setEmptyMessage("");

      const isCategoryScoped = Boolean(activeFilters.category);
      const params = {
        search: activeFilters.search || undefined,
        subCategory: activeFilters.subcategory || undefined,
        subcategory: activeFilters.subcategory || undefined,
        minPrice: activeFilters.minPrice,
        maxPrice: activeFilters.maxPrice,
        sort: activeFilters.sort,
      };

      const endpoint = isCategoryScoped ? `/products/category/${activeFilters.category}` : "/products";
      if (!isCategoryScoped) {
        params.category = undefined;
      }

      const { data } = await api.get(endpoint, { params });
      if (requestId !== requestCounterRef.current) {
        return;
      }

      const normalized = uniqueById(Array.isArray(data) ? data : []);
      setProducts(normalized);

      if (!normalized.length) {
        setEmptyMessage(
          activeFilters.category
            ? "No products found in this category"
            : "No products found for the selected filters"
        );
      }
    } catch (error) {
      if (requestId !== requestCounterRef.current) {
        return;
      }

      setEmptyMessage("");
      const status = error?.response?.status;
      if (status === 404 && activeFilters.category) {
        setProducts([]);
        setEmptyMessage(error?.response?.data?.message || "No products found in this category");
        return;
      }

      toast.error(error?.response?.data?.message || "Failed to load products");
    } finally {
      if (requestId === requestCounterRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts(filters);
  }, [filters]);

  const categoryOptions = useMemo(
    () => [{ slug: "", name: "All Categories" }, ...categories.map((c) => ({ slug: c.slug, name: c.name }))],
    [categories]
  );

  const selectedCategoryObject = useMemo(
    () => categories.find((category) => category.slug === filters.category) || null,
    [categories, filters.category]
  );

  const subcategoryOptions = useMemo(() => {
    if (!selectedCategoryObject?.subcategories?.length) {
      return [{ slug: "", name: "All Subcategories" }];
    }
    return [
      { slug: "", name: "All Subcategories" },
      ...selectedCategoryObject.subcategories.map((sub) => ({ slug: sub.slug, name: sub.name })),
    ];
  }, [selectedCategoryObject]);

  const updateQueryParams = (nextCategory, nextSubcategory) => {
    const params = {};
    if (nextCategory) params.category = nextCategory;
    if (nextSubcategory) params.subcategory = nextSubcategory;
    setSearchParams(params);
  };

  const addToCart = async (product) => {
    if (!user || user.role !== "customer") {
      toast.error("Please login as customer first");
      navigate("/customer-auth");
      return;
    }

    if (Number(product?.stock || 0) <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    setAddingProductId(product._id);
    try {
      await api.post("/cart", { productId: product._id, quantity: 1 });
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add to cart");
    } finally {
      setTimeout(() => setAddingProductId(""), 450);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user || user.role !== "customer") {
      toast.error("Please login as customer first");
      navigate("/customer-auth");
      return;
    }

    try {
      const { data } = await api.post("/users/wishlist/toggle", { productId });
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update wishlist");
    }
  };

  return (
    <main className="page-wrap">
      <section className="filter-panel glass">
        <input
          placeholder="Search jewellery"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
        />
        <select
          className="animated-dropdown"
          value={filters.category}
          onChange={(e) => {
            const category = e.target.value;
            setFilters((prev) => ({ ...prev, category, subcategory: "" }));
            updateQueryParams(category, "");
          }}
        >
          {categoryOptions.map((c) => (
            <option key={c.slug || "all"} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="animated-dropdown"
          value={filters.subcategory}
          disabled={!filters.category}
          onChange={(e) => {
            const subcategory = e.target.value;
            setFilters((prev) => ({ ...prev, subcategory }));
            updateQueryParams(filters.category, subcategory);
          }}
        >
          {subcategoryOptions.map((sub) => (
            <option key={sub.slug || "all-sub"} value={sub.slug}>
              {sub.name}
            </option>
          ))}
        </select>
        <select
          value={filters.sort}
          className="animated-dropdown"
          onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Low to High</option>
          <option value="price_desc">High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
        <div className="range-row">
          <label>Price up to: Rs.{filters.maxPrice}</label>
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={filters.maxPrice}
            onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))}
          />
        </div>
      </section>

      <section className="category-chip-nav">
        {categories.map((category) => (
          <button
            key={category._id}
            className={`chip ${filters.category === category.slug ? "active" : ""}`}
            onClick={() => {
              const next = filters.category === category.slug ? "" : category.slug;
              setFilters((prev) => ({ ...prev, category: next, subcategory: "" }));
              updateQueryParams(next, "");
            }}
          >
            {category.name}
          </button>
        ))}
      </section>

      {loading ? (
        <Loader text="Curating jewellery pieces..." />
      ) : !products.length ? (
        <section className="section-wrap glass">
          <h3>{emptyMessage || "No products found"}</h3>
          <p>Try another category, subcategory, or adjust filters.</p>
        </section>
      ) : (
        <section className="product-grid">
          {products.map((product, index) => {
            const image = product.images?.[0] || product.imageUrl;
            const discountedPrice = Math.round(Number(product.price) * 0.88);
            const outOfStock = Number(product.stock || 0) <= 0;
            return (
              <motion.article
                key={product._id}
                className={`product-card glass ${addingProductId === product._id ? "cart-pop" : ""}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.02 }}
              >
                <Link to={`/products/${product._id}`}>
                  <img src={image} alt={product.name} loading="lazy" />
                </Link>
                <span className="badge-discount">12% OFF</span>
                {outOfStock && <span className="badge-stock badge-stock-out">Out of Stock</span>}
                <button className="quick-view-btn" onClick={() => setQuickViewProduct(product)}>
                  Quick View
                </button>
                <div className="card-body">
                  <h3>{product.name}</h3>
                  <div className="price-row">
                    <p className="price">Rs.{Number(product.price).toLocaleString()}</p>
                    <span className="strike-price">Rs.{discountedPrice.toLocaleString()}</span>
                  </div>
                  <div className="rating-row">{starRow(product.rating)}</div>
                  <small>
                    {product.category?.name || "Uncategorized"}
                    {product.subcategoryDetails?.name ? ` / ${product.subcategoryDetails.name}` : ""}
                  </small>
                  <p className={`stock-note ${outOfStock ? "out" : "in"}`}>
                    {outOfStock ? "Out of stock" : `In stock (${product.stock})`}
                  </p>
                </div>
                <div className="card-actions">
                  <button className="btn btn-primary ripple" disabled={outOfStock} onClick={() => addToCart(product)}>
                    {outOfStock ? "Out of Stock" : "Add to Cart"}
                  </button>
                  <button className="btn btn-light ripple" onClick={() => toggleWishlist(product._id)}>
                    Wishlist
                  </button>
                </div>
              </motion.article>
            );
          })}
        </section>
      )}

      <AnimatePresence>
        {quickViewProduct && (
          <motion.div
            className="image-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickViewProduct(null)}
          >
            <motion.div
              className="image-modal quick-view-modal"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 14, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <img src={quickViewProduct.images?.[0] || quickViewProduct.imageUrl} alt={quickViewProduct.name} />
              <h3>{quickViewProduct.name}</h3>
              <p>{quickViewProduct.description}</p>
              <div className="rating-row">{starRow(quickViewProduct.rating)}</div>
              <p className="price">Rs.{Number(quickViewProduct.price).toLocaleString()}</p>
              <div className="quick-view-actions">
                <Link className="btn btn-light ripple" to={`/products/${quickViewProduct._id}`} onClick={() => setQuickViewProduct(null)}>
                  View Details
                </Link>
                <button
                  className="btn btn-primary ripple"
                  disabled={Number(quickViewProduct.stock || 0) <= 0}
                  onClick={() => {
                    addToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                >
                  {Number(quickViewProduct.stock || 0) <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ProductsPage;
