require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const VideoDatas = require("./backend/models/video");
const mongoUrl = "mongodb://127.0.0.1:27017/VideoData";
const passport = require("passport");
const LocalStrategy = require("passport-local");
const engine = require("ejs-mate");
const path = require("path");
const User = require("./backend/models/user");
const flash = require("express-flash");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;
const fs = require("fs");
const promises = require("fs").promises;
const favicon = require("serve-favicon");
const port = 3030;
const wrapasync = require("./backend/utils.js/wrapasync.js");
const ErrorExpress = require("./backend/utils.js/error.js");
const { cloudinary } = require("./backend/cloudconfig.js");
const uploads = path.join(__dirname, "uploads");
const thumbnail = path.join(__dirname, "thumbnail");
const cup = path.join(__dirname, "cup");
// file making

if (!fs.existsSync(uploads)) {
  fs.mkdirSync(uploads);
}
if (!fs.existsSync(cup)) {
  fs.mkdirSync(cup);
}
if (!fs.existsSync(thumbnail)) {
  fs.mkdirSync(thumbnail);
}
// ffmmpeg setup

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

//multer  setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["video/mp4"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only MP4 videos are allowed"));
  }
};
const upload = multer({ storage, fileFilter });
app.use("/thumbnail", express.static(path.join(__dirname, "thumbnail")));
app.use(express.static(path.join(__dirname, "frontend", "public")));
app.use(favicon(path.join(__dirname, "backend", "favicon", "favicon.ico")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("views", path.join(__dirname, "./backend/views"));
app.set("view engine", "ejs");
app.engine("ejs", engine);
app.use(require("cookie-parser")("keybodarCat"));
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(
  require("express-session")({
    secret: "keyboardcat",
    resave: true,
    saveUninitialized: true,
    cookie: {
      expires: 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// new video Route
app.get("/newvideo", (req, res) => res.render("add.ejs"));
app.post("/newvideo", upload.single("video"), async (req, res, next) => {
  const inputPath = req.file.path;
  const timeStamp = new Date().toLocaleString();
  const originalname = path.parse(req.file.originalname).name;

  const outputPath = path.join(cup, `${originalname}_compressed.mp4`);
  const thumbPath = path.join(
    thumbnail,
    `${originalname}_compressedthumbnail.jpg`
  );
  function ffmpegfx(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-c:v libx264", // H.264 video codec
          "-preset veryfast", // Compression speed/quality balance
          "-crf 28", // Lower means better quality (18–28)
          "-c:a aac", // Audio codec
          "-b:a 128k",
        ])

        .on("end", async () => {
          try {
            console.log("compressfinished");

            ffmpeg(outputPath)
              .screenshots({
                count: 1,
                folder: path.dirname(thumbPath),
                filename: path.basename(
                  `${originalname}_compressedthumbnail.jpg`
                ),
                size: "320x240",
              })
              .on("end", async () => {
                console.log("thumbnail Generated");
                resolve();
              })
              .on("error", (err) => {
                console.log("compressError", err);
                reject(new ErrorExpress("thumbnail not generated"));
              });
          } catch (err) {
            reject(new ErrorExpress("failed  upl thumbnai at cloudinary"));
          }
        })
        .on("end", (req, res) => {
          console.log("finished doing ffmpegfx");
        })
        .on("error", (err) => {
          reject(new ErrorExpress("failed upl vidoe at cloudinary"));
        })
        .save(outputPath);
    });
  }
  try {
    console.log("fcx called");
    await ffmpegfx(inputPath, outputPath);

    const result = await cloudinary.uploader.upload(outputPath, {
      folder: "ProjectX",
      resource_type: "video",
      format: "mp4",
      public_id: `${originalname}_${timeStamp}`, // same logic as in your CloudinaryStorage config
    });
    const result2 = await cloudinary.uploader.upload(thumbPath, {
      folder: "ProjectX",
      resource_type: "image",
      format: "jpg",
      public_id: `${originalname}_${timeStamp}_thumb`,
    });

    const newvid = new VideoDatas(req.body.video);
    newvid.title = "new video !!!";
    newvid.description = `Uploaded at ${new Date().toLocaleString()}`;
    newvid.video.url = result.secure_url;
    newvid.video.thumbnailUrl = result2.secure_url;
    newvid.video.filename = result.public_id;

    await newvid.save();
    req.flash("success", "Video Uploaded ⭐");
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    fs.unlinkSync(thumbPath);
    res.redirect("/");
  } catch (err) {
    console.log("upload err".err);
    req.flash("error", "we are unable at your region");
    res.redirect("/");
  }
});
// signup Route

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});
app.post("/signup", async (req, res) => {
  let { email, username, password } = req.body;
  let user = new User({ email, username });
  let nw = await User.register(user, password);
  req.login(nw, (err) => {
    if (err) {
      return next(err);
    } else {
      res.redirect("/");
      req.flash("success", `welcome You ${username}`);
    }
  });
  res.cookie(username, password, {
    signed: true,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
  });
});
// login route

app.get("/login", (req, res) => {
  res.render("login");
});
app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  function (req, res) {
    let { username, password } = req.user;
    res.cookie(username, password, {
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
    });
    req.flash("success", `welcome ${username}`);
    res.redirect("/");
  }
);
//logout Route

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      req.flash("error", "password Validation failed");
      next(err);
    }
    req.flash("success", "you are looged out❤️‍🔥");
    res.redirect("/");
  });
});
// main middleware

app.use((err, req, res, next) => {
  console.log("middele ware runninx");
  console.error(err.message);
  req.flash("error", err.message);
  // res.status(500).json({ success: false, error: err.message });
  next();
});
//locals middleware

app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  res.locals.currUser = req.user;
  next();
});
//index Route and home.ejs

app.get("/", async (req, res) => {
  // console.log(req.user);
  const data = await VideoDatas.find();
  res.render("home.ejs", { data });
});
//search Route and search.ejs

app.get("/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.render("search", { result: [] });
  const word = query.split(" ");
  const regexes = word.map((word) => new RegExp(word, "i"));
  const results = await VideoDatas.find({
    $or: regexes.flatMap((rgx) => [{ title: rgx }, { description: rgx }]),
  });
  res.render("search.ejs", { results, searchQuery: query });
});

//show Route and show.ejs

app.get(
  "/video/:id/show",
  wrapasync(async (req, res) => {
    const { id } = req.params;
    const vid = await VideoDatas.findById(id);
    res.render("show.ejs", { vid });
  })
);

//serverXdb

app.listen(port, () => {
  console.log("server on at https://localhost:3030");
});
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
