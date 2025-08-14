# 🎥👻 TOURIST –  An Anonymous Video Sharing Platform

 TOURIST is a full-stack video sharing platform where users can upload, stream, and view videos. The platform is designed to scale with modern tools, offering both local and cloud-based video hosting (e.g., Bunny.net).

---

## 🚀 Features

- 🎥 Upload only `.mp4` videos
- 🗂 Paginated video gallery (Home page)
- ⏱ Upload progress tracking
- ❤️ Like and comment system *(coming soon)*
- 👤 User profile with uploaded videos 
- 🖼 Thumbnail support *(optional via FFmpeg or Bunny.net)*
- 🔒 Video access control *(planned)*

---

## 🛠 Tech Stack

- **Frontend**:  JavaScript , EJS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Video Hosting**:
  - Local storage *(dev/test)*
  - [Bunny.net](https://bunny.net/) *(production-ready)*
  - Cloudinary 

---

## 📂 Project Structure 
```
Tourist/
├── models/
│ └── VideoDatas.js # Mongoose video model
├── public/ # Static files (CSS, JS)
├── videos/ # Locally stored videos (served via Express)
├── views/ # EJS templates
├── routes/
│ └── index.js # Routes and pagination
├── importVideos.js # Script to import .mp4 files into MongoDB
├── app.js # Main Express server
└── README.md
```

## 📦 Setup Instructions

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/Tourist.git
   
