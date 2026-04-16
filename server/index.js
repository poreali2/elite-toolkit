import express from "express";
import cors from "cors";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import fs from "fs";

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

/* ================= RAILWAY FIX ================= */
app.set("trust proxy", 1);

/* ================= CORS FIX ================= */
const allowedOrigins = [
  "https://elite-toolkit.vercel.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, true); // لا تكسر الطلبات
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

/* مهم جداً لـ preflight */
app.options("*", cors());

app.use(express.json({ limit: "2mb" }));

/* ================= HOSTS ================= */
const SUPPORTED_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  "tiktok.com",
  "www.tiktok.com",
  "vm.tiktok.com",
  "instagram.com",
  "www.instagram.com",
];

function isValidVideoUrl(url) {
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return false;

    return SUPPORTED_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith("." + h)
    );
  } catch {
    return false;
  }
}

function sanitizeFilename(name) {
  return (name || "download")
    .replace(/[^\w\s.\-]/g, "_")
    .slice(0, 200);
}

/* ================= RATE LIMIT ================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

app.use("/api", limiter);

/* ================= DOWNLOAD ================= */
app.post("/api/download", async (req, res) => {
  const { url, type } = req.body;

  if (!url) return res.status(400).json({ error: "URL required" });

  const cleanUrl = url.trim();

  if (!isValidVideoUrl(cleanUrl)) {
    return res.status(400).json({ error: "Unsupported URL" });
  }

  try {
    console.log("[DOWNLOAD]", cleanUrl);

    const command =
      `yt-dlp --no-playlist --no-warnings --ignore-errors ` +
      `--extractor-args "youtube:player_client=android" ` +
      `--dump-json "${cleanUrl}"`;

    const { stdout } = await execAsync(command, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (!stdout) throw new Error("Empty response");

    let info;
    try {
      info = JSON.parse(stdout);
    } catch {
      return res.status(500).json({ error: "yt-dlp parse error" });
    }

    const formats = [];

    /* MP3 */
    if (type === "mp3") {
      formats.push({
        type: "mp3",
        quality: "audio",
        label: "Best Audio",
        url: `/api/stream?url=${encodeURIComponent(
          cleanUrl
        )}&format=bestaudio/best&title=${encodeURIComponent(
          info.title || "audio"
        )}&ext=mp3`,
      });
    }

    /* VIDEO */
    else {
      const heights = [1080, 720, 480, 360];

      for (const h of heights) {
        formats.push({
          quality: `${h}p`,
          label: h >= 1080 ? "Full HD" : h >= 720 ? "HD" : "SD",
          url: `/api/stream?url=${encodeURIComponent(
            cleanUrl
          )}&format=best&title=${encodeURIComponent(
            info.title || "video"
          )}&ext=mp4`,
        });
      }
    }

    return res.json({
      title: info.title || "Unknown",
      thumbnail: info.thumbnail || "",
      duration: info.duration_string || "",
      uploader: info.uploader || "",
      platform: info.extractor_key || "",
      formats,
    });
  } catch (err) {
    console.error("[DOWNLOAD ERROR]", err.message);
    return res.status(500).json({
      error: "Failed to process video",
      detail: err.message,
    });
  }
});

/* ================= STREAM ================= */
app.get("/api/stream", (req, res) => {
  try {
    const { url, title, ext, format } = req.query;

    if (!url) return res.status(400).json({ error: "URL required" });

    const decoded = decodeURIComponent(url);

    if (!isValidVideoUrl(decoded)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const safeTitle = sanitizeFilename(title || "download");
    const safeExt = ["mp4", "mp3", "webm", "m4a"].includes(ext)
      ? ext
      : "mp4";

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle}.${safeExt}"`
    );

    const args = [
      "--no-playlist",
      "--no-warnings",
      "--ignore-errors",
      "-f",
      format || "bv*+ba/b",
      "-o",
      "-",
      decoded,
    ];

    console.log("[STREAM]", args.join(" "));

    const ytdlp = spawn("yt-dlp", args);

    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on("data", (d) => {
      console.log("[yt-dlp]", d.toString());
    });

    ytdlp.on("error", (err) => {
      console.error("[STREAM ERROR]", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream failed" });
      }
    });

    req.on("close", () => ytdlp.kill("SIGTERM"));
  } catch (e) {
    console.error("[STREAM FATAL]", e);
    res.status(500).json({ error: "Internal error" });
  }
});

/* ================= HEALTH ================= */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});