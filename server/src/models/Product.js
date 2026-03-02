import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    imageMeta: {
      type: [
        new mongoose.Schema(
          {
            url: { type: String, required: true, trim: true },
            width: { type: Number, min: 1, default: 1 },
            height: { type: Number, min: 1, default: 1 },
            size: { type: Number, min: 1, default: 1 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
  },
  { timestamps: true }
);

productSchema.pre("validate", function syncPrimaryImage(next) {
  if ((!this.images || !this.images.length) && this.imageUrl) {
    this.images = [this.imageUrl];
  }
  if (!this.imageUrl && this.images?.length) {
    this.imageUrl = this.images[0];
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
