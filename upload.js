require("dotenv").config();
const fs = require("fs");
const path = require("path");
const VideoDatas = require("./backend/models/video");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;
// const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const { exec } = require("child_process");
const mongoose = require("mongoose");
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const uploads = path.join(__dirname, "uploads");
const cup = path.join(__dirname, "cup");
const thumbnail = path.join(__dirname, "thumbnail");
const hlsOutput = path.join(__dirname, "hls", "videos");
const genTags = require("./use");
const { get } = require("http");

if (!fs.existsSync(uploads)) {
  fs.mkdirSync(uploads);
}
if (!fs.existsSync(cup)) {
  fs.mkdirSync(cup);
}
if (!fs.existsSync(thumbnail)) {
  fs.mkdirSync(thumbnail);
}
function ffmpegfx(inputPath, outputPath, originalname, thumbPath) {
  return new Promise((resolve, reject) => {
    let timeoutId;
    let finished = false;

    // timeout reject
    timeoutId = setTimeout(() => {
      if (!finished) {
        finished = true;
        reject(
          new Error(
            `FFmpeg process timed out after 
              2mins
          ${originalname}`
          )
        );
      }
    }, 2 * 60 * 1000);
    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-preset veryfast",
        "-crf 28",
        "-c:a aac",
        "-b:a 128k",
      ])
      .on("end", () => {
        finished = true;
        clearTimeout(timeoutId);
        console.log(`Compression done for ${originalname}`);
        ffmpeg(inputPath)
          .screenshots({
            count: 1,
            folder: path.dirname(thumbPath),
            filename: path.basename(`${originalname}_compressedthumbnail.jpg`),
            size: "320x240",
          })
          .on("end", () => {
            finished = true;
            clearTimeout(timeoutId);
            console.log(`Thumbnail generated for ${originalname}`);
            resolve();
          })
          .on("error", (err) => {
            finished = false;
            clearTimeout(timeoutId);
            console.log(err);
            reject;
          });
      })
      .on("error", reject)
      .save(outputPath);
  });
}
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
async function bulkUploadAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
    const allfiles = fs.readdirSync(uploads);
    console.log("the total files are", allfiles.length);
    const files = fs
      .readdirSync(uploads)
      .filter((file) => file.endsWith(".mp4"))
      .filter((file) => !file.toLowerCase().includes("copy"))
      .filter((file) => !file.toLowerCase().includes("compressed"))
      .filter((file) => !/\(\d+\)\.mp4$/.test(file));
    console.log("the file length new", files.length);
    allfiles.forEach((file) => {
      // deleting copied files
      if (!files.includes(file)) {
        const filepath = path.join(uploads, file);
        fs.unlinkSync(filepath, (err) => {
          if (err) {
            console.log(`cant dlt ❌ ${filepath}`, err);
          } else {
            console.log(`dlted ✅✅✅ ${filepath}`, err);
          }
        });
      }
    });
    for (const file of files) {
      const inputPath = path.join(uploads, file);
      const originalname = path.parse(file).name.split(" ");
      let newname = originalname?.[0] ?? "" + originalname?.[1] ?? "";
      const outputPath = path.join(cup, `${newname}_compressed.mp4`);
      const thumbPath = path.join(
        thumbnail,
        `${newname}_compressedthumbnail.jpg`
      );
      console.log(`Processing: ${file}`);
      try {
        await ffmpegfx(inputPath, outputPath, newname, thumbPath);
        const result0 = await convertToHLS(outputPath, "hls/videos", newname);
        // Step 3: Save to MongoDB
        const newvid = new VideoDatas();
        newvid.title = newname;
        newvid.description = `Uploaded at ${new Date().toLocaleString()}`;
        newvid.video.url = `https://tourist-h76q.onrender.com/${result0.m3u8Path.replace(
          /\\/g,
          "/"
        )}`;
        // newvid.video.owner = "Anonymous";
        newvid.video.thumbnailUrl = `https://tourist-h76q.onrender.com/thumbnail/${newname}_compressedthumbnail.jpg`;
        newvid.video.filename = newname;
        newvid.video.tags = genTags();
        await newvid.save();
        console.log(`Saved to DB: ${newname}`);
        fs.unlinkSync(inputPath, (err) => {
          if (err) {
            console.log(`cant dlt ${filepath}`, err);
          } else {
            console.log("dlted");
          }
        });
      } catch (err) {
        console.log(err.message);
      }
    }
    console.log("All videos processed ✅");

    process.exit(0);
  } catch (err) {
    console.error("Error in bulk upload:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected — script finished ✅");
  }
}

bulkUploadAdmin();
