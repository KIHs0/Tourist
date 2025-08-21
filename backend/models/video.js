const mongoose = require("mongoose");
const user = require("./user");
const videoSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  video: {
    filename: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
        required: true,
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
});
const VideoData = mongoose.model("VideoData", videoSchema);
module.exports = VideoData;
