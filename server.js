require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const VideoDatas = require("./backend/models/video");
const mongoUrl = process.env.MONGO_URL;
const passport = require("passport");
const LocalStrategy = require("passport-local");
// @ts-ignore
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
const { title } = require("process");
const uploads = path.join(__dirname, "uploads");
const thumbnail = path.join(__dirname, "thumbnail");
const cup = path.join(__dirname, "cup");
const { exec, spawn, fork, execFile } = require("child_process");
const { sessionTracker, Session } = require("./backend/utils.js/session.js");
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
app.use(favicon(path.join(__dirname, "backend", "favicon", "favicon2.png")));
app.use(express.urlencoded({ extended: true }));
app.use("/hls", express.static(path.join(__dirname, "hls")));
app.use("/thumbnail", express.static(path.join(__dirname, "thumbnail")));
app.use(express.json());
app.set("views", path.join(__dirname, "./backend/views"));
app.set("view engine", "ejs");
app.engine("ejs", engine);
app.use(require("cookie-parser")("keybodarCat"));
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

const session = require("express-session");
const MongoStore = require("connect-mongo");
const store = MongoStore.create({
  mongoUrl: process.env.MONGO_URL,
  touchAfter: 24 * 3600,
  crypto: {
    secret: process.env.SECRET,
  },
  collectionName: "sessions",
});

app.use(
  session({
    store,
    secret: "sadfasdfasdfasd",
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(
  require("cors")({
    origin: "https://tourist-h76q.onrender.com", // or "*" for testing
    // origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(flash());
app.use(sessionTracker);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// new video Route and compression of video using ffmpeg
app.get("/newvideo", (req, res) => res.render("add.ejs"));
app.post("/newvideo", upload.single("video"), async (req, res, next) => {
  const inputPath = req.file.path;
  const timeStamp = new Date().toISOString();
  const originalname = path.parse(req.file.originalname).name.split(" ");
  let newname = originalname?.[0] ?? "" + originalname?.[1] ?? "";
  const outputPath = path.join(cup, `${newname}_compressed.mp4`);
  const thumbPath = path.join(thumbnail, `${newname}_compressedthumbnail.jpg`);
  function convertToHLS(inputPath, outputFolder, videoName) {
    return new Promise((resolve, reject) => {
      const outDir = path.join(outputFolder, videoName);
      fs.mkdirSync(outDir, { recursive: true });

      const cmd = `${ffmpegPath} -i "${inputPath}" -c:v libx264 -preset veryfast -crf 21 -c:a aac -b:a 128k -ac 2 -hls_time 6 -hls_playlist_type vod -hls_flags independent_segments -hls_segment_filename "${outDir}/seg_%03d.ts" "${outDir}/index.m3u8"`;

      exec(cmd, (error) => {
        console.log("exec hls cmd executing");
        if (error) {
          console.log(error);
          return reject(error);
        }
        resolve({ m3u8Path: `${outDir}/index.m3u8` });
      });
    });
  }

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

            ffmpeg(inputPath)
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
    req.flash("success", "video is uploading ...");
    res.redirect("/");
    await ffmpegfx(inputPath, outputPath);
    const result0 = await convertToHLS(outputPath, "hls/videos", newname);
    console.log(result0.m3u8Path);
    const newvid = new VideoDatas(req.body.video);
    newvid.title = req.body.video.title || "new video !!!";
    newvid.description = `Uploaded at ${new Date().toLocaleString()}`;
    newvid.video.url = `https://tourist-h76q.onrender.com/${result0.m3u8Path.replace(
      /\\/g,
      "/"
    )}`;
    newvid.video.tags = req.body.video.categories;
    newvid.video.owner = req.body.video.name || "Anonymous";

    newvid.video.thumbnailUrl = `https://tourist-h76q.onrender.com/thumbnail/${originalname}_compressedthumbnail.jpg`;
    newvid.video.filename = originalname;
    await newvid.save().then((thenres) => {
      console.log(thenres);
    });
    // await Promise.all([
    //   await fs.promises.rm(uploads, { recursive: true, force: true }),
    //   await fs.promises.rm(cup, { recursive: true, force: true }),
    // ]);
    // fs.rm(thumbPath, { recursive: true, force: true }, (err) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     console.log("thumbPath dlted");
    //   }
    // });
    // fs.rm("hls\video", { recursive: true, force: true }, (err) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     console.log("hls dlted");
    //   }
    // });
    req.flash("success", "Video Uploaded ⭐");
    process.exit(0);
  } catch (err) {
    console.log("upload err", err);
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

//locals middleware
app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  res.locals.currUser = req.user;
  next();
});
//index Route and home.ejs
app.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const total = await VideoDatas.countDocuments({});
  const totalPages = Math.ceil(total / limit);
  console.log({ page, skip, total, totalPages });
  if (page > totalPages) {
    res.render("err.ejs", { message: "Page Not Found" });
    return;
  }

  const data = await VideoDatas.find({})
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit);
  // const title = data.flatMap((e) => e.title);
  // res.json({ data: title });
  // return;
  // res.json({
  //   vurl: "https://tourist-h76q.onrender.com/video/05_20250327_235957__comp.mp4",
  // });
  res.render("home.ejs", { data, totalPages, currentPage: page });
});
app.get("/admin", async (req, res) => {
  try {
    const token = req.query.token;
    if (token !== "oshikloveswiku") {
      res.redirect("/");
      return;
    }

    const totalSessions = await Session.countDocuments();
    const activeSessions = await Session.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // active in last 5 mins
    });

    const allSessions = await Session.find().sort({ lastActive: -1 }).limit(50); // recent 50
    res.render("admin", {
      totalSessions,
      activeSessions,
      sessions: allSessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
//search Route and search.ejs
app.get("/search", async (req, res) => {
  console.log("/search running");
  const query = req.query.query;
  if (!query) return res.render("search", { result: [] });
  const word = query.split(" ");
  const regexes = word.map((word) => new RegExp(word, "i"));
  console.log(regexes);
  const results = await VideoDatas.find({
    $or: regexes.flatMap((rgx) => [{ title: rgx }, { description: rgx }]),
  });
  res.render("search.ejs", { results, searchQuery: query });
});
// search live and result and sending res to frontend
app.get("/search/live", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.json([]);
  }

  const words = query.split(" ").filter(Boolean);
  const regexes = words.map((word) => new RegExp(word, "i"));
  try {
    const results = await VideoDatas.find({
      $or: regexes.flatMap((rgx) => [{ title: rgx }, { description: rgx }]),
    }).limit(6);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
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
// categories route and cateogires.ejs
app.get(
  "/video/categories/:tags",
  wrapasync(async (req, res) => {
    let query = decodeURIComponent(req.params.tags);
    const regex = new RegExp(query, "i");
    const results = await VideoDatas.find({ "video.tags": regex });
    if (!results) return;

    res.render("categories.ejs", { results, query });
  })
);
// main middleware
app.use((err, req, res, next) => {
  req.flash("error", err.message);
  // next();
});

//serverXdb
async function startServer() {
  try {
    await mongoose.connect(mongoUrl);
    console.log("MongoDB connected successfully");

    app.listen(port, () => {
      console.log(`Server running at https://localhost:${port}`);
    });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // stop server if DB fails
  }
}

startServer();
