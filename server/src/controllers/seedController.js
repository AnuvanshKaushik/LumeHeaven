import Category from "../models/Category.js";
import slugify from "slugify";

export const ensureDefaultCategories = async () => {
  const defaults = [
    {
      name: "Rings",
      description: "Elegant rings for timeless looks",
      subcategories: ["Gold Rings", "Silver Rings", "Diamond Rings"],
    },
    {
      name: "Necklaces",
      description: "Statement necklaces with premium craft",
      subcategories: ["Gold Necklaces", "Layered Necklaces", "Pendant Necklaces"],
    },
    {
      name: "Earrings",
      description: "Delicate and bold earrings",
      subcategories: ["Stud Earrings", "Hoop Earrings", "Drop Earrings"],
    },
    {
      name: "Bracelets",
      description: "Luxury bracelets for every occasion",
      subcategories: ["Gold Bracelets", "Silver Bracelets", "Beaded Bracelets", "Charm Bracelets"],
    },
  ];

  for (const item of defaults) {
    const slug = slugify(item.name, { lower: true, strict: true });
    const existing = await Category.findOne({ slug });
    if (!existing) {
      await Category.create({
        name: item.name,
        slug,
        description: item.description,
        subcategories: item.subcategories.map((name) => ({
          name,
          slug: slugify(name, { lower: true, strict: true }),
        })),
      });
      continue;
    }

    if (!existing.subcategories?.length && item.subcategories?.length) {
      existing.subcategories = item.subcategories.map((name) => ({
        name,
        slug: slugify(name, { lower: true, strict: true }),
      }));
      await existing.save();
    }
  }
};
