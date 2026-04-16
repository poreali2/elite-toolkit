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

/* ================= IMPORTANT FIX (Railway / Proxy) ================= */
app.set("trust proxy", 1);

/* ================= CORS ================= */
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://elite-toolkit.vercel.app",
];

/* ================= HOST VALIDATION ================= */
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

/* ================= HELPERS ================= */
function isValidVideoUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;

    return SUPPORTED_HOSTS.some(
      (host) =>
        parsed.hostname === host || parsed.hostname.endsWith("." + host)
    );
  } catch {
    return false;
  }
}

function sanitizeFilename(name) {
  return name.replace(/[^\w\s.\-]/g, "_").trim().slice(0, 200);
}

/* ================= RATE LIMIT (FIXED) ================= */
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,

  standardHeaders: true,
  legacyHeaders: false,

  // 🔥 مهم جداً على Railway
  keyGenerator: (req) => req.ip,
});

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // ما نكسر الطلبات
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "2mb" }));

/* ================= DOWNLOAD ================= */
app.post("/api/download", downloadLimiter, async (req, res) => {
  const { url, type } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL required" });
  }

  const cleanUrl = url.trim().slice(0, 2048);

  if (!isValidVideoUrl(cleanUrl)) {
    return res.status(400).json({ error: "Unsupported URL" });
  }

  try {
    console.log("[DOWNLOAD]", cleanUrl);

    /* ===== cookies optional (safe) ===== */
    const cookiePath = "/tmp/cookies.txt";

    if (process.env.YT_COOKIES) {
      fs.writeFileSync(cookiePath, process.env.YT_COOKIES);
    }

    const cookieArg = process.env.YT_COOKIES
      ? `--cookies ${cookiePath}`
      : "";

    /* ===== FIXED yt-dlp command ===== */
    const command = `yt-dlp ${cookieArg} --dump-json --no-playlist --no-warnings --ignore-errors "${cleanUrl}"`;

    const { stdout } = await execAsync(command, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (!stdout) throw new Error("Empty response from yt-dlp");

    const info = JSON.parse(stdout);

    const formats = [];

    /* ================= MP3 ================= */
    if (type === "mp3") {
      formats.push({
        type: "mp3",
        quality: "audio",
        label: "Best Audio",
        url: `/api/stream?url=${encodeURIComponent(
          cleanUrl
        )}&format=bestaudio&title=${encodeURIComponent(
          info.title || "audio"
        )}&ext=mp3`,
      });
    }

    /* ================= VIDEO ================= */
    else {
      const targetHeights = [1080, 720, 480, 360];

      const available = new Set(
        (info.formats || [])
          .filter((f) => f.vcodec !== "none" && f.height)
          .map((f) => f.height)
      );

      for (const h of targetHeights) {
        const match = [...available].find(
          (a) => a <= h && a >= h - 20
        );

        if (match) {
          formats.push({
            quality: `${h}p`,
            label:
              h >= 1080 ? "Full HD" : h >= 720 ? "HD" : "SD",
            url: `/api/stream?url=${encodeURIComponent(
              cleanUrl
            )}&format=bestvideo[height<=${h}]+bestaudio&title=${encodeURIComponent(
              info.title || "video"
            )}&ext=mp4`,
          });
        }
      }

      if (!formats.length) {
        formats.push({
          quality: "best",
          label: "Auto",
          url: `/api/stream?url=${encodeURIComponent(cleanUrl)}&format=best`,
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
app.get("/api/stream", async (req, res) => {
  const { url, format, title, ext } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL required" });
  }

  const decodedUrl = decodeURIComponent(url);

  if (!isValidVideoUrl(decodedUrl)) {
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
    "-f",
    format || "best",
    "--no-playlist",
    "--no-warnings",
    "--ignore-errors",
    "-o",
    "-",
    decodedUrl,
  ];

  const ytdlp = spawn("yt-dlp", args);

  ytdlp.stdout.pipe(res);

  ytdlp.stderr.on("data", (d) => {
    console.error("[yt-dlp]", d.toString());
  });

  ytdlp.on("error", (err) => {
    console.error("[STREAM ERROR]", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Stream failed" });
    }
  });

  req.on("close", () => ytdlp.kill("SIGTERM"));
});

/* ================= HEALTH ================= */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});