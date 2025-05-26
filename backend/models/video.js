const mongoose = require("mongoose");
const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  video: {
    filename: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },

  tags: [
    {
      type: String,
    },
  ],
});
const VideoData = mongoose.model("VideoData", videoSchema);
module.exports = VideoData;
