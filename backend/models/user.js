const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const User = new Schema({
  email: {
    type: String,
    required: true,
  },
  subscribers: {
    type: Number,
    default: 0,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "VideoData",
  },
  videos: {
    type: Number,
    default: 0,
  },
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", User);
