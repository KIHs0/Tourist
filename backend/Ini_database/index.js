const mongoose = require("mongoose");
const VideoData = require("../models/video");
const mongoUrl =
  "mongodb+srv://kihsogaming:TMN5co49rNR4GWEs@cluster0.17qkru9.mongodb.net/Tourist?retryWrites=true&w=majority&appName=Cluster0";

const initdb = async function () {
  const res = await VideoData.updateMany(
    {},
    { $set: { views: 781, likes: 0, dislikes: 0, comments: [] } },
    { strict: false }
  );
  console.log(res);
  // console.log(await VideoData.find());
  // await Promise.all(
  //   data.map(async (doc) => {
  //     // const cleanTitle = doc.title.replace(/undefined/, "");
  //     await VideoData.updateOne(
  //       { _id: doc._id },
  //       { $set: { title: cleanTitle } }
  //     );

  //   })
  // );

  process.exit(0);
};

async function main() {
  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to MongoDB");

  await initdb();
}
main()
  .then((res) => {
    console.log("server X database");
  })
  .catch((err) => {
    console.log("err happen connecting db");
  });
