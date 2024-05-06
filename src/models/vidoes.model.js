import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const vidoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: [true, "videos must me required"],
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: [true, "pleace give Vidoe title "],
    },
    description: {
      type: String,
      required: true,
    },
    duraction: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);
vidoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", vidoSchema);
