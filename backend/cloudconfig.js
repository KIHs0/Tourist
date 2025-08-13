const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: "ProjectX",
    resource_type: "video",
    format: "mp4", // supports promises as well
    public_id: `${file.originalname.split(".")[0]}_${Date.now()}`,
  }),
});
module.exports = {
  cloudinary,
  storage,
};
