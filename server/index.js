import express from "express";
import cors from "cors";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

/* ================= إنشاء ملف الكوكيز تلقائياً ================= */
// هذا الجزء يقرأ محتوى الكوكيز من Variables في Railway وينشئ الملف للسيرفر
const cookiesPath = path.join(__dirname, "cookies.txt");

if (process.env.COOKIES_CONTENT) {
  try {
    fs.writeFileSync(cookiesPath, process.env.COOKIES_CONTENT);
    console.log("✅ Cookies file created successfully from COOKIES_CONTENT.");
  } catch (err) {
    console.error("❌ Failed to create cookies file:", err.message);
  }
} else {
  console.warn("⚠️ Warning: COOKIES_CONTENT variable is missing.");
}

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
    origin: function (origin, callback) {
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
    return SUPPORTED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
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
  max: 100, 
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

    // بناء الأمر مع دعم الكوكيز و IPv4 لتجنب الحظر
    let command = `yt-dlp --no-playlist --no-warnings --ignore-errors --force-ipv4 --dump-json `;
    
    if (fs.existsSync(cookiesPath)) {
      command += `--cookies "${cookiesPath}" `;
    }
    
    command += `--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" `;
    command += `"${cleanUrl}"`;

    const { stdout } = await execAsync(command, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (!stdout) throw new Error("Could not fetch video info");

    const info = JSON.parse(stdout);
    const formats = [];

    if (type === "mp3") {
      formats.push({
        type: "mp3",
        quality: "audio",
        label: "Best Audio (MP3)",
        url: `/api/stream?url=${encodeURIComponent(cleanUrl)}&format=bestaudio/best&title=${encodeURIComponent(info.title || "audio")}&ext=mp3`,
      });
    } else {
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
      error: "YouTube is blocking the request. Update COOKIES_CONTENT or try again later.",
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
    if (!isValidVideoUrl(decoded)) return res.status(400).json({ error: "Invalid URL" });

    const safeTitle = sanitizeFilename(title || "download");
    const safeExt = ["mp4", "mp3", "webm", "m4a"].includes(ext) ? ext : "mp4";

    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.${safeExt}"`);
    res.setHeader("Content-Type", safeExt === "mp3" ? "audio/mpeg" : "video/mp4");

    const args = [
      "--no-playlist",
      "--no-warnings",
      "--force-ipv4",
      "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "-f", format || "best",
      "-o", "-",
    ];

    if (fs.existsSync(cookiesPath)) {
      args.push("--cookies", cookiesPath);
    }

    args.push(decoded);

    const ytdlp = spawn("yt-dlp", args);
    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on("data", (d) => {
      console.log("[yt-dlp stream log]", d.toString());
    });

    ytdlp.on("error", (err) => {
      console.error("[SPAWN ERROR]", err.message);
      if (!res.headersSent) res.status(500).send("Streaming Error");
    });

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
  res.json({ status: "ok", message: "Server is healthy", cookies_active: fs.existsSync(cookiesPath) });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});