const mongoose = require("mongoose");
const VideoData = require("../models/video");
let { data } = require("./init");
const mongoUrl = "mongodb://127.0.0.1:27017/VideoData";

const initdb = async function () {
  
  await VideoData.insertMany(data);
};
initdb();

async function main() {
  await mongoose.connect(mongoUrl);
}
main()
  .then((res) => {
    console.log("server X database");
  })
  .catch((err) => {
    console.log("err happen connecting db");
  });
