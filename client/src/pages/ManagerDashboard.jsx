import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";

const emptyProduct = {
  name: "",
  price: "",
  category: "",
  subcategory: "",
  description: "",
  stock: "",
  images: [],
  imageMeta: [],
};

const emptyCategory = { name: "", description: "" };
const emptySubcategory = { categoryId: "", name: "", description: "" };

const ManagerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [subcategoryForm, setSubcategoryForm] = useState(emptySubcategory);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState({ categoryId: null, subcategoryId: null });
  const [selectedUploadFiles, setSelectedUploadFiles] = useState([]);
  const [localPreviews, setLocalPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingSubcategory, setSavingSubcategory] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const loadAll = async () => {
    try {
      const [productsRes, categoriesRes, ordersRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
        api.get("/orders"),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setOrders(ordersRes.data);
      if (!productForm.category && categoriesRes.data.length) {
        setProductForm((prev) => ({ ...prev, category: categoriesRes.data[0]._id }));
      }
      if (!subcategoryForm.categoryId && categoriesRes.data.length) {
        setSubcategoryForm((prev) => ({ ...prev, categoryId: categoriesRes.data[0]._id }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load manager data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    return () => {
      localPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [localPreviews]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === productForm.category) || null,
    [categories, productForm.category]
  );

  const selectedCategorySubcategories = selectedCategory?.subcategories || [];

  const selectedSubcategoryCategory = useMemo(
    () => categories.find((category) => category._id === subcategoryForm.categoryId) || null,
    [categories, subcategoryForm.categoryId]
  );

  const metrics = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const pendingOrders = orders.filter((order) => order.status === "Pending").length;
    return [
      { label: "Products", value: products.length },
      { label: "Categories", value: categories.length },
      { label: "Orders", value: orders.length },
      { label: "Pending", value: pendingOrders },
      { label: "Revenue", value: `Rs.${Math.round(revenue).toLocaleString()}` },
    ];
  }, [orders, products, categories]);

  const resetProductForm = () => {
    setProductForm({
      ...emptyProduct,
      category: categories[0]?._id || "",
    });
    setEditingProductId(null);
    setSelectedUploadFiles([]);
    localPreviews.forEach((url) => URL.revokeObjectURL(url));
    setLocalPreviews([]);
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategory);
  };

  const resetSubcategoryForm = () => {
    setEditingSubcategory({ categoryId: null, subcategoryId: null });
    setSubcategoryForm((prev) => ({ ...emptySubcategory, categoryId: prev.categoryId || categories[0]?._id || "" }));
  };

  const setImageFiles = (incomingFiles) => {
    const files = Array.from(incomingFiles || []);
    if (!files.length) return;

    const validFiles = files.filter((file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024);
    if (!validFiles.length) {
      toast.error("Only image files up to 5MB are allowed");
      return;
    }

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setSelectedUploadFiles((prev) => [...prev, ...validFiles]);
    setLocalPreviews((prev) => [...prev, ...newPreviews]);
  };

  const onDropFiles = (event) => {
    event.preventDefault();
    setImageFiles(event.dataTransfer.files);
  };

  const uploadSelectedImages = async () => {
    if (!selectedUploadFiles.length) {
      toast.error("Select images before uploading");
      return;
    }

    setUploadingImages(true);
    try {
      const formData = new FormData();
      selectedUploadFiles.forEach((file) => formData.append("images", file));
      const { data } = await api.post("/uploads/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProductForm((prev) => ({
        ...prev,
        images: [...prev.images, ...data.images.map((image) => image.url)],
        imageMeta: [...prev.imageMeta, ...data.images],
      }));
      toast.success(`${data.images.length} image(s) uploaded`);
      localPreviews.forEach((url) => URL.revokeObjectURL(url));
      setLocalPreviews([]);
      setSelectedUploadFiles([]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeUploadedImage = (index) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imageMeta: prev.imageMeta.filter((_, i) => i !== index),
    }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    if (!productForm.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!productForm.category) {
      toast.error("Select a category");
      return;
    }
    if (!productForm.images.length) {
      toast.error("Upload at least one product image");
      return;
    }
    if (Number(productForm.price) < 0 || Number(productForm.stock) < 0) {
      toast.error("Price and stock cannot be negative");
      return;
    }

    const payload = {
      ...productForm,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      subcategory: productForm.subcategory || null,
      imageUrl: productForm.images[0],
    };

    setSavingProduct(true);
    try {
      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
      }

      resetProductForm();
      await loadAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save product");
    } finally {
      setSavingProduct(false);
    }
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSavingCategory(true);
    try {
      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, categoryForm);
        toast.success("Category updated");
      } else {
        await api.post("/categories", categoryForm);
        toast.success("Category added");
      }
      resetCategoryForm();
      await loadAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save category");
    } finally {
      setSavingCategory(false);
    }
  };

  const saveSubcategory = async (event) => {
    event.preventDefault();

    if (!subcategoryForm.categoryId) {
      toast.error("Select a category for subcategory");
      return;
    }
    if (!subcategoryForm.name.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    setSavingSubcategory(true);
    try {
      if (editingSubcategory.categoryId && editingSubcategory.subcategoryId) {
        await api.put(
          `/categories/${editingSubcategory.categoryId}/subcategories/${editingSubcategory.subcategoryId}`,
          {
            name: subcategoryForm.name,
            description: subcategoryForm.description,
          }
        );
        toast.success("Subcategory updated");
      } else {
        await api.post(`/categories/${subcategoryForm.categoryId}/subcategories`, {
          name: subcategoryForm.name,
          description: subcategoryForm.description,
        });
        toast.success("Subcategory added");
      }
      resetSubcategoryForm();
      await loadAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save subcategory");
    } finally {
      setSavingSubcategory(false);
    }
  };

  const editCategory = (category) => {
    setEditingCategoryId(category._id);
    setCategoryForm({ name: category.name, description: category.description || "" });
    setActiveSection("categories");
  };

  const deleteCategory = async (categoryId) => {
    try {
      await api.delete(`/categories/${categoryId}`);
      toast.success("Category deleted");
      if (editingCategoryId === categoryId) {
        resetCategoryForm();
      }
      await loadAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete category");
    }
  };

  const editSubcategory = (categoryId, subcategory) => {
    setEditingSubcategory({ categoryId, subcategoryId: subcategory._id });
    setSubcategoryForm({
      categoryId,
      name: subcategory.name,
      description: subcategory.description || "",
    });
    setActiveSection("categories");
  };

  const deleteSubcategory = async (categoryId, subcategoryId) => {
    try {
      await api.delete(`/categories/${categoryId}/subcategories/${subcategoryId}`);
      toast.success("Subcategory deleted");
      if (editingSubcategory.subcategoryId === subcategoryId) {
        resetSubcategoryForm();
      }
      await loadAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete subcategory");
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete product");
    }
  };

  const editProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name,
      price: product.price,
      category: product.category?._id || "",
      subcategory: product.subcategory || "",
      description: product.description,
      stock: product.stock,
      images: product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [],
      imageMeta: product.imageMeta || [],
    });
    setSelectedUploadFiles([]);
    localPreviews.forEach((url) => URL.revokeObjectURL(url));
    setLocalPreviews([]);
    setActiveSection("products");
  };

  if (loading) return <Loader text="Loading manager dashboard..." />;

  return (
    <main className="page-wrap manager-shell">
      <aside className="manager-sidebar glass">
        <h2>Manager Panel</h2>
        <button className={`sidebar-link ${activeSection === "overview" ? "active" : ""}`} onClick={() => setActiveSection("overview")}>
          Overview
        </button>
        <button className={`sidebar-link ${activeSection === "products" ? "active" : ""}`} onClick={() => setActiveSection("products")}>
          Products
        </button>
        <button className={`sidebar-link ${activeSection === "categories" ? "active" : ""}`} onClick={() => setActiveSection("categories")}>
          Categories
        </button>
        <Link className="sidebar-link" to="/manager/orders">
          Orders
        </Link>
        <Link className="sidebar-link" to="/manager/analytics">
          Analytics
        </Link>
      </aside>

      <section className="manager-content">
        {activeSection === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <section className="analytics-grid">
              {metrics.map((metric) => (
                <article key={metric.label} className="glass stat-card">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </article>
              ))}
            </section>
            <section className="section-wrap glass">
              <h2>Recent Orders</h2>
              <div className="order-list">
                {orders.slice(0, 5).map((order) => (
                  <article key={order._id} className="order-card">
                    <h3>{order.orderId}</h3>
                    <p>{order.customer?.name}</p>
                    <p>Status: {order.status}</p>
                    <p>Total: Rs.{Number(order.total).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeSection === "products" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="manager-grid">
            <form className="glass form-grid" onSubmit={saveProduct}>
              <h2>{editingProductId ? "Edit Product" : "Add Product"}</h2>
              <input required placeholder="Name" value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} />
              <input required type="number" step="0.01" min={0} placeholder="Price" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} />
              <select required className="animated-dropdown" value={productForm.category} onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value, subcategory: "" }))}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select className="animated-dropdown" value={productForm.subcategory} disabled={!productForm.category} onChange={(event) => setProductForm((prev) => ({ ...prev, subcategory: event.target.value }))}>
                <option value="">Select subcategory (optional)</option>
                {selectedCategorySubcategories.map((subcategory) => (
                  <option key={subcategory._id} value={subcategory._id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
              <input required type="number" min={0} placeholder="Stock" value={productForm.stock} onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))} />
              <textarea required rows={3} placeholder="Description" value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} />

              <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={onDropFiles}>
                <p>Drag and drop product images here</p>
                <p>or</p>
                <label className="btn btn-light ripple">
                  Select files
                  <input hidden type="file" accept="image/*" multiple onChange={(event) => setImageFiles(event.target.files)} />
                </label>
              </div>

              {localPreviews.length > 0 && (
                <div className="preview-grid">
                  {localPreviews.map((preview) => (
                    <img key={preview} src={preview} alt="Local preview" />
                  ))}
                </div>
              )}

              {selectedUploadFiles.length > 0 && (
                <button className="btn btn-ghost ripple" type="button" onClick={uploadSelectedImages} disabled={uploadingImages}>
                  {uploadingImages ? "Uploading..." : `Upload ${selectedUploadFiles.length} selected image(s)`}
                </button>
              )}

              {!!productForm.images.length && (
                <div className="preview-grid">
                  {productForm.images.map((img, index) => (
                    <div key={`${img}-${index}`} className="preview-item">
                      <img src={img} alt={`Uploaded ${index + 1}`} />
                      <button className="mini-btn danger" type="button" onClick={() => removeUploadedImage(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn btn-primary ripple" type="submit" disabled={savingProduct}>
                {savingProduct ? "Saving..." : editingProductId ? "Update Product" : "Create Product"}
              </button>
              {editingProductId && (
                <button className="btn btn-light ripple" type="button" onClick={resetProductForm}>
                  Cancel
                </button>
              )}
            </form>

            <section className="section-wrap glass">
              <h2>Inventory ({products.length})</h2>
              <div className="product-grid">
                {products.map((product) => (
                  <article key={product._id} className="product-card glass">
                    <img src={product.images?.[0] || product.imageUrl} alt={product.name} loading="lazy" />
                    <div className="card-body">
                      <h3>{product.name}</h3>
                      <p className="price">Rs.{Number(product.price).toLocaleString()}</p>
                      <p>
                        {product.category?.name || "-"}
                        {product.subcategoryDetails?.name ? ` / ${product.subcategoryDetails.name}` : ""}
                      </p>
                      <small>Stock: {product.stock}</small>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-light ripple" onClick={() => editProduct(product)}>
                        Edit
                      </button>
                      <button className="btn btn-danger ripple" onClick={() => deleteProduct(product._id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeSection === "categories" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="manager-grid">
            <form className="glass form-grid" onSubmit={saveCategory}>
              <h2>Manage Categories</h2>
              <input required placeholder="Category name" value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} />
              <textarea placeholder="Description" rows={3} value={categoryForm.description} onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))} />
              <button className="btn btn-primary ripple" type="submit" disabled={savingCategory}>
                {savingCategory ? "Saving..." : editingCategoryId ? "Update Category" : "Add Category"}
              </button>
              {editingCategoryId && (
                <button className="btn btn-light ripple" type="button" onClick={resetCategoryForm}>
                  Cancel
                </button>
              )}
            </form>

            <form className="glass form-grid" onSubmit={saveSubcategory}>
              <h2>Manage Subcategories</h2>
              <select required className="animated-dropdown" value={subcategoryForm.categoryId} onChange={(event) => setSubcategoryForm((prev) => ({ ...prev, categoryId: event.target.value }))}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input required placeholder="Subcategory name" value={subcategoryForm.name} onChange={(event) => setSubcategoryForm((prev) => ({ ...prev, name: event.target.value }))} />
              <textarea rows={2} placeholder="Subcategory description" value={subcategoryForm.description} onChange={(event) => setSubcategoryForm((prev) => ({ ...prev, description: event.target.value }))} />
              <button className="btn btn-primary ripple" type="submit" disabled={savingSubcategory}>
                {savingSubcategory ? "Saving..." : editingSubcategory.subcategoryId ? "Update Subcategory" : "Add Subcategory"}
              </button>
              {editingSubcategory.subcategoryId && (
                <button className="btn btn-light ripple" type="button" onClick={resetSubcategoryForm}>
                  Cancel
                </button>
              )}
              {selectedSubcategoryCategory && (
                <div className="subcategory-list">
                  {selectedSubcategoryCategory.subcategories?.map((subcategory) => (
                    <span key={subcategory._id} className="status-pill">
                      {subcategory.name}
                      <button className="mini-btn" type="button" onClick={() => editSubcategory(selectedSubcategoryCategory._id, subcategory)}>
                        Edit
                      </button>
                      <button className="mini-btn danger" type="button" onClick={() => deleteSubcategory(selectedSubcategoryCategory._id, subcategory._id)}>
                        Delete
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </form>

            <section className="glass category-tree">
              <h2>Category Tree</h2>
              {categories.map((category) => (
                <div key={category._id} className="category-group">
                  <div className="status-pill">
                    <strong>{category.name}</strong>
                    <button className="mini-btn" type="button" onClick={() => editCategory(category)}>
                      Edit
                    </button>
                    <button className="mini-btn danger" type="button" onClick={() => deleteCategory(category._id)}>
                      Delete
                    </button>
                  </div>
                  <div className="subcategory-list">
                    {(category.subcategories || []).map((subcategory) => (
                      <span key={subcategory._id} className="status-pill">
                        {subcategory.name}
                        <button className="mini-btn" type="button" onClick={() => editSubcategory(category._id, subcategory)}>
                          Edit
                        </button>
                        <button className="mini-btn danger" type="button" onClick={() => deleteSubcategory(category._id, subcategory._id)}>
                          Delete
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </motion.div>
        )}
      </section>
    </main>
  );
};

export default ManagerDashboard;
