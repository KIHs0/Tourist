require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const VideoData = require("./backend/models/video");
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
const fs = require("fs");
const favicon = require("serve-favicon");
ffmpeg.setFfmpegPath(ffmpegPath);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const { storages, cloudinary } = require("./backend/cloudconfig.js");
const wrapasync = require("./backend/utils.js/wrapasync.js");
const ErrorExpress = require("./backend/utils.js/error.js");
const { stripTypeScriptTypes } = require("module");
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "video/mp4") {
    cb(null, true);
  } else {
    cb(new Error("Only .mp4 videos are allowed!"), false);
  }
};
const upload = multer({ storage });
// const upload = multer({ storage, fileFilter });

app.use(express.static(path.join(__dirname, "frontend", "public")));
app.use(favicon(path.join(__dirname, "backend", "favicon", "favicon.ico")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("views", path.join(__dirname, "./backend/views"));
app.set("view engine", "ejs");
app.engine("ejs", engine);
const port = 3030;
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
app.get("/newvideo", (req, res) => res.render("add.ejs"));

const compressedDir = path.join(__dirname, "compressedUploads");
if (!fs.existsSync(compressedDir)) {
  fs.mkdirSync(compressedDir);
}

app.post("/newvideo", upload.single("video"), async (req, res, next) => {
  const inputPath = req.file.path;
  const originalname = path.parse(req.file.originalname).name;
  const outputPath = path.join(compressedDir, `${originalname}_compressed.mp4`);
  console.log({ outputPath, compressedDir });
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
            await fs.promises.unlink(inputPath, (err) => {
              console.log("uplod del 101");
            });
            resolve("101 done deleting from uploads");
          } catch {
            reject(err);
          }
        })
        .on("error", (err) => {
          console.log("compressError", err);
          reject(err);
        })
        .save(outputPath);
    });
  }
  try {
    console.log("fcx called");
    await ffmpegfx(inputPath, outputPath);
    const newvid = new VideoData(req.body.video);
    newvid.title = "new video !!!";
    let date = Date.now();
    newvid.description = ` Uploaded At ${date}`;
    newvid.video.url = req.file.path;
    newvid.video.thumbnailUrl =
      "https://www.nsbpictures.com/wp-content/uploads/2021/01/background-for-thumbnail-youtube-14.jpg";
    newvid.video.filename = req.file.filename;
    let nw = await newvid.save().then((res) => {
      console.log("new video uploaded");
    });
    console.log(nw);
    req.flash("success", "Video Uploaded ⭐");
    res.redirect("/");
  } catch {
    req.flash("error", "we are unable at your region");
  }
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
// main middleware/
app.use((err, req, res, next) => {
  console.log("middele ware runninx");
  console.error(err.message);
  req.flash("error", err.message);
  // res.status(500).json({ success: false, error: err.message });
  next();
});

app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.get("/", async (req, res) => {
  console.log(req.user);
  const data = await VideoData.find();
  res.render("home.ejs", { data });
});
app.get(
  "/video/:id/show",
  wrapasync(async (req, res) => {
    const { id } = req.params;
    const vid = await VideoData.findById(id);
    res.render("show.ejs", { vid });
  })
);
app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});
app.get("/login", (req, res) => {
  res.render("login");
});

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
