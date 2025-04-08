import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: true,
      // unique: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "This is an awesome video.",
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: "67efcd21085c9d13584e00af",
      enum: [
        "Cars and vehicles",
        "Comedy",
        "Education",
        "Gaming",
        "Entertainment",
        "Film and animation",
        "How-to and style",
        "Music",
        "News and politics",
        "People and blogs",
        "Pets and animals",
        "Science and technology",
        "Sports",
        "Travel and events",
        "Uncategorised",
      ],
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },
    videoPreview: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Plugin is a mongoose hook
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
