const mongoose = require("mongoose");
const VideoData = require("../models/video");
const mongoUrl =
  "mongodb+srv://kihsogaming:TMN5co49rNR4GWEs@cluster0.17qkru9.mongodb.net/Tourist?retryWrites=true&w=majority&appName=Cluster0";

const initdb = async function () {
  const data = await VideoData.find({ title: /undefined/ });
  await Promise.all(
    data.map(async (doc) => {
      const cleanTitle = doc.title.replace(/undefined/, "");
      const res = await VideoData.updateOne(
        { _id: doc._id },
        { $set: { title: cleanTitle } }
      );
    })
  );

  process.exit(0);
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
