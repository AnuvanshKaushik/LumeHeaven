import Category from "../models/Category.js";
import Product from "../models/Product.js";

const mapProductWithSubcategory = (productDoc) => {
  const product = productDoc.toObject ? productDoc.toObject() : productDoc;
  const subcategoryId = product.subcategory?.toString();
  const subcategory =
    subcategoryId && product.category?.subcategories
      ? product.category.subcategories.find((sub) => sub._id.toString() === subcategoryId)
      : null;

  return {
    ...product,
    imageUrl: product.imageUrl || product.images?.[0] || "",
    images: product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [],
    subcategory: subcategoryId || null,
    subcategoryDetails: subcategory
      ? { _id: subcategory._id, name: subcategory.name, slug: subcategory.slug }
      : null,
  };
};

const normalizeImages = ({ images, imageUrl }) => {
  const normalizedFromArray = Array.isArray(images)
    ? images.map((img) => String(img || "").trim()).filter(Boolean)
    : [];

  if (normalizedFromArray.length) {
    return normalizedFromArray;
  }

  if (imageUrl && String(imageUrl).trim()) {
    return [String(imageUrl).trim()];
  }

  return [];
};

const ensureCategorySubcategoryRelation = ({ category, subcategory }) => {
  if (!subcategory) {
    return null;
  }

  const match = category.subcategories.find((sub) => sub._id.toString() === subcategory.toString());
  return match || null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveCategoryByQuery = async (categoryQuery) => {
  const normalized = String(categoryQuery || "")
    .trim()
    .toLowerCase();
  if (!normalized) {
    return null;
  }

  const asName = normalized.replace(/-/g, " ");
  return Category.findOne({
    $or: [
      { slug: normalized },
      { name: { $regex: `^${escapeRegex(asName)}$`, $options: "i" } },
    ],
  });
};

const resolveSubcategoryByQuery = (categoryDoc, subcategoryQuery) => {
  const normalized = String(subcategoryQuery || "")
    .trim()
    .toLowerCase();
  if (!normalized || !categoryDoc?.subcategories?.length) {
    return null;
  }

  return (
    categoryDoc.subcategories.find((item) => item.slug === normalized) ||
    categoryDoc.subcategories.find((item) => item.name.toLowerCase() === normalized.replace(/-/g, " "))
  );
};

const buildProductFilter = async ({ search, category, subcategory, subCategory, minPrice, maxPrice }) => {
  const filter = {};
  let categoryDoc = null;
  let subcategoryDoc = null;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    categoryDoc = await resolveCategoryByQuery(category);
    if (!categoryDoc) {
      return { filter: null, categoryDoc: null, subcategoryDoc: null };
    }
    filter.category = categoryDoc._id;
  }

  const subcategoryQuery = subcategory || subCategory;
  if (subcategoryQuery) {
    if (!categoryDoc) {
      const normalizedSub = String(subcategoryQuery).trim().toLowerCase();
      categoryDoc = await Category.findOne({
        $or: [
          { "subcategories.slug": normalizedSub },
          { "subcategories.name": { $regex: `^${escapeRegex(normalizedSub.replace(/-/g, " "))}$`, $options: "i" } },
        ],
      });
    }

    if (!categoryDoc) {
      return { filter: null, categoryDoc: null, subcategoryDoc: null };
    }

    subcategoryDoc = resolveSubcategoryByQuery(categoryDoc, subcategoryQuery);
    if (!subcategoryDoc) {
      return { filter: null, categoryDoc, subcategoryDoc: null };
    }

    filter.category = categoryDoc._id;
    filter.subcategory = subcategoryDoc._id;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  return { filter, categoryDoc, subcategoryDoc };
};

const fetchFilteredProducts = async ({ filter, sort }) => {
  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
    rating: { rating: -1 },
  };

  const products = await Product.find(filter)
    .populate("category", "name slug subcategories")
    .sort(sortMap[sort] || { createdAt: -1 });

  return products.map(mapProductWithSubcategory);
};

export const getProducts = async (req, res) => {
  try {
    const { search, category, subcategory, subCategory, minPrice, maxPrice, sort } = req.query;
    const { filter } = await buildProductFilter({
      search,
      category,
      subcategory,
      subCategory,
      minPrice,
      maxPrice,
    });

    if (!filter) {
      return res.json([]);
    }

    const products = await fetchFilteredProducts({ filter, sort });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const categoryQuery = req.params.category;
    const subCategoryQuery = req.query.subCategory || req.query.subcategory;
    const { filter, categoryDoc } = await buildProductFilter({
      search: req.query.search,
      category: categoryQuery,
      subcategory: subCategoryQuery,
      subCategory: subCategoryQuery,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
    });

    if (!categoryDoc) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!filter) {
      return res.status(404).json({ message: "Subcategory not found in this category" });
    }

    const products = await fetchFilteredProducts({ filter, sort: req.query.sort || "newest" });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch category products", error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name slug subcategories");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(mapProductWithSubcategory(product));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch product", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, images, imageUrl, price, category, subcategory, description, stock, imageMeta } = req.body;
    const normalizedImages = normalizeImages({ images, imageUrl });

    if (!name || !normalizedImages.length || price === undefined || !description || !category || stock === undefined) {
      return res.status(400).json({ message: "All required product fields must be provided" });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const matchedSubcategory = ensureCategorySubcategoryRelation({
      category: categoryDoc,
      subcategory,
    });
    if (subcategory && !matchedSubcategory) {
      return res.status(400).json({ message: "Selected subcategory does not belong to this category" });
    }

    const product = await Product.create({
      name: String(name).trim(),
      imageUrl: normalizedImages[0],
      images: normalizedImages,
      imageMeta: Array.isArray(imageMeta) ? imageMeta : [],
      price: Number(price),
      category,
      subcategory: matchedSubcategory?._id || null,
      description: String(description).trim(),
      stock: Number(stock),
    });

    const populated = await product.populate("category", "name slug subcategories");
    return res.status(201).json(mapProductWithSubcategory(populated));
  } catch (error) {
    return res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, images, imageUrl, price, category, subcategory, description, stock, imageMeta } = req.body;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const targetCategoryId = category || existingProduct.category;
    const categoryDoc = await Category.findById(targetCategoryId);
    if (!categoryDoc) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const normalizedImages =
      images !== undefined || imageUrl !== undefined
        ? normalizeImages({ images, imageUrl })
        : existingProduct.images?.length
          ? existingProduct.images
          : existingProduct.imageUrl
            ? [existingProduct.imageUrl]
            : [];

    if (!normalizedImages.length) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const requestedSubcategory = subcategory === "" ? null : subcategory ?? existingProduct.subcategory;
    const matchedSubcategory = ensureCategorySubcategoryRelation({
      category: categoryDoc,
      subcategory: requestedSubcategory,
    });
    if (requestedSubcategory && !matchedSubcategory) {
      return res.status(400).json({ message: "Selected subcategory does not belong to this category" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name !== undefined ? String(name).trim() : existingProduct.name,
        imageUrl: normalizedImages[0],
        images: normalizedImages,
        imageMeta: Array.isArray(imageMeta) ? imageMeta : existingProduct.imageMeta,
        price: price !== undefined ? Number(price) : existingProduct.price,
        category: targetCategoryId,
        subcategory: matchedSubcategory?._id || null,
        description: description !== undefined ? String(description).trim() : existingProduct.description,
        stock: stock !== undefined ? Number(stock) : existingProduct.stock,
      },
      { new: true, runValidators: true }
    ).populate("category", "name slug subcategories");

    return res.json(mapProductWithSubcategory(updatedProduct));
  } catch (error) {
    return res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};

export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existing = product.reviews.find((r) => r.user.toString() === req.user.id);
    if (existing) {
      return res.status(400).json({ message: "You already reviewed this product" });
    }

    product.reviews.push({
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment: comment || "",
    });

    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.numReviews;

    await product.save();

    return res.status(201).json({ message: "Review added" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add review", error: error.message });
  }
};
