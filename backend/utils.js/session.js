// middlewares/sessionTracker.js
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  ip: String,
  userAgent: String,
  startTime: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 }, // in seconds
});

const Session = mongoose.model("Session", sessionSchema, "customsessions");

const sessionTracker = async (req, res, next) => {
  try {
    const sessionId = req.ip + "_" + req.get("User-Agent"); // crude but works
    let session = await Session.findOne({ sessionId });

    if (!session) {
      session = new Session({
        sessionId,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      await session.save();
    } else {
      const now = new Date();
      const duration =
        (now.getTime() - new Date(session.startTime).getTime()) / 1000;
      session.lastActive = now;
      session.duration = duration;
      await session.save();
    }

    next();
  } catch (err) {
    console.error("Session tracking error:", err);
    next();
  }
};

module.exports = { sessionTracker, Session };
