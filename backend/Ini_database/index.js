const mongoose = require("mongoose");
const VideoData = require("../models/video");
const mongoUrl =
  "mongodb+srv://kihsogaming:TMN5co49rNR4GWEs@cluster0.17qkru9.mongodb.net/Tourist?retryWrites=true&w=majority&appName=Cluster0";

const initdb = async function () {
  const data = await VideoData.find();
  await Promise.all(
    data.map(async (doc) => {
      doc.video.owner = "Anonymous01";
      doc.video.url = doc.video.url.replace(
        "http://localhost:3030",
        "https://tourist-h76q.onrender.com"
      );
      doc.video.thumbnailUrl = doc.video.thumbnailUrl.replace(
        "http://localhost:3030",
        "https://tourist-h76q.onrender.com"
      );
      await doc.save(); // Save the full Mongoose document
    })
  );
}; 
// initdb();

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
