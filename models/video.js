const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const videoSchema = new Schema(
  {
    title: { type: String, required: true },
    titleInMarathi: { type: String, required: true },
    link: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", videoSchema);
