import mongoose from "mongoose";
import slugify from "slugify";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const toSubcategoryPayload = ({ name, description }) => ({
  name: name.trim(),
  slug: slugify(name, { lower: true, strict: true }),
  description: (description || "").trim(),
});

const sortCategorySubcategories = (category) => {
  category.subcategories.sort((a, b) => a.name.localeCompare(b.name));
  return category;
};

export const getCategories = async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json(categories.map((category) => sortCategorySubcategories(category)));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const slug = slugify(name, { lower: true, strict: true });
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: (description || "").trim(),
    });
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create category", error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const slug = slugify(name, { lower: true, strict: true });
    const duplicate = await Category.findOne({
      slug,
      _id: { $ne: req.params.id },
    });
    if (duplicate) {
      return res.status(409).json({ message: "Another category already uses this name" });
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        slug,
        description: (description || "").trim(),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update category", error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const inUse = await Product.exists({ category: req.params.id });
    if (inUse) {
      return res.status(400).json({
        message: "Cannot delete category because products are assigned to it",
      });
    }

    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json({ message: "Category deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete category", error: error.message });
  }
};

export const createSubcategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Subcategory name is required" });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const payload = toSubcategoryPayload({ name, description });
    const duplicate = category.subcategories.some((sub) => sub.slug === payload.slug);
    if (duplicate) {
      return res.status(409).json({ message: "Subcategory already exists in this category" });
    }

    category.subcategories.push(payload);
    await category.save();
    sortCategorySubcategories(category);
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create subcategory", error: error.message });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Subcategory name is required" });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategory = category.subcategories.id(req.params.subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const payload = toSubcategoryPayload({ name, description });
    const duplicate = category.subcategories.some(
      (sub) => sub.slug === payload.slug && sub._id.toString() !== req.params.subcategoryId
    );
    if (duplicate) {
      return res.status(409).json({ message: "Another subcategory already uses this name" });
    }

    subcategory.name = payload.name;
    subcategory.slug = payload.slug;
    subcategory.description = payload.description;
    await category.save();

    return res.json(sortCategorySubcategories(category));
  } catch (error) {
    return res.status(500).json({ message: "Failed to update subcategory", error: error.message });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    const { id, subcategoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ message: "Invalid subcategory id" });
    }

    const inUse = await Product.exists({
      category: id,
      subcategory: new mongoose.Types.ObjectId(subcategoryId),
    });
    if (inUse) {
      return res.status(400).json({
        message: "Cannot delete subcategory because products are assigned to it",
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    subcategory.deleteOne();
    await category.save();
    return res.json(sortCategorySubcategories(category));
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete subcategory", error: error.message });
  }
};
