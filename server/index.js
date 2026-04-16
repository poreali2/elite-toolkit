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
// مهم جداً لأن Railway يعمل خلف Proxy
app.set("trust proxy", 1);

/* ================= CORS FIX ================= */
const allowedOrigins = [
  "https://elite-toolkit.vercel.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // السماح بالطلبات التي ليس لها origin (مثل تطبيقات الموبايل أو curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* معالجة طلبات Preflight لجميع المسارات */
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
  max: 50, // رفعتها قليلاً لتجنب الحظر السريع أثناء التجارب
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
    console.log("[DOWNLOAD REQUEST]", cleanUrl);

    // إضافة User-Agent وهمي لتجنب حظر يوتيوب للسيرفرات
    const command =
      `yt-dlp --no-playlist --no-warnings --ignore-errors ` +
      `--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" ` +
      `--dump-json "${cleanUrl}"`;

    const { stdout } = await execAsync(command, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (!stdout) throw new Error("Could not fetch video info");

    let info;
    try {
      info = JSON.parse(stdout);
    } catch {
      return res.status(500).json({ error: "Failed to parse video data" });
    }

    const formats = [];

    /* MP3 Logic */
    if (type === "mp3") {
      formats.push({
        type: "mp3",
        quality: "audio",
        label: "Best Audio (MP3)",
        url: `/api/stream?url=${encodeURIComponent(cleanUrl)}&format=bestaudio/best&title=${encodeURIComponent(info.title || "audio")}&ext=mp3`,
      });
    } 
    /* VIDEO Logic */
    else {
      // يفضل استخدام best لإرجاع رابط مباشر مدمج فيه الصوت والفيديو لسهولة الاستريم
      const qualities = [
        { q: "best", label: "High Quality" },
        { q: "worst", label: "Low Quality" }
      ];

      for (const item of qualities) {
        formats.push({
          quality: item.label,
          label: item.label,
          url: `/api/stream?url=${encodeURIComponent(cleanUrl)}&format=${item.q}&title=${encodeURIComponent(info.title || "video")}&ext=mp4`,
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
      error: "Server failed to process this video. YouTube might be blocking the request.",
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
    const safeExt = ["mp4", "mp3", "webm", "m4a"].includes(ext) ? ext : "mp4";

    // إعداد الرؤوس لإجبار المتصفح على التحميل
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.${safeExt}"`);
    res.setHeader("Content-Type", safeExt === "mp3" ? "audio/mpeg" : "video/mp4");

    const args = [
      "--no-playlist",
      "--no-warnings",
      "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "-f", format || "best",
      "-o", "-",
      decoded,
    ];

    console.log("[STREAMING START]", safeTitle);

    const ytdlp = spawn("yt-dlp", args);

    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on("data", (d) => {
      // طباعة الأخطاء في الكونسول فقط لتتبع المشاكل
      console.log("[yt-dlp log]", d.toString());
    });

    ytdlp.on("error", (err) => {
      console.error("[SPAWN ERROR]", err.message);
      if (!res.headersSent) {
        res.status(500).send("Streaming Error");
      }
    });

    // إنهاء العملية عند إغلاق العميل للمتصفح
    req.on("close", () => {
      if (ytdlp) ytdlp.kill("SIGTERM");
    });

  } catch (e) {
    console.error("[STREAM FATAL]", e);
    if (!res.headersSent) res.status(500).json({ error: "Internal error" });
  }
});

/* ================= HEALTH ================= */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Server is healthy" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});