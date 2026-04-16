import express from "express";
import cors from "cors";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import rateLimit from "express-rate-limit";
import "dotenv/config";

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

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

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait 15 minutes before trying again.",
  },
});

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "1kb" }));

app.post("/api/download", downloadLimiter, async (req, res) => {
  const { url, type } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A valid URL is required." });
  }

  const cleanUrl = url.trim().slice(0, 2048);

  if (!isValidVideoUrl(cleanUrl)) {
    return res.status(400).json({
      error:
        "Unsupported platform. We support YouTube, TikTok, and Instagram URLs.",
    });
  }

  try {
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-playlist --no-warnings "${cleanUrl}"`,
      { timeout: 30000 }
    );

    const info = JSON.parse(stdout);
    const formats = [];

    if (type === "mp3") {
      formats.push({
        type: "mp3",
        quality: "MP3 Audio",
        label: "Best Quality Audio",
        url: `/api/stream?url=${encodeURIComponent(cleanUrl)}&format=bestaudio%2Fbest&title=${encodeURIComponent(info.title || "audio")}&ext=mp3`,
      });
    } else {
      const targetHeights = [1080, 720, 480, 360];
      const availableHeights = new Set(
        (info.formats || [])
          .filter((f) => f.vcodec !== "none" && f.height)
          .map((f) => f.height)
      );

      for (const h of targetHeights) {
        const match = [...availableHeights].find(
          (ah) => ah <= h && ah >= h - 20
        );
        if (match) {
          formats.push({
            quality: `${h}p`,
            label:
              h >= 1080
                ? "Full HD"
                : h >= 720
                ? "HD"
                : h >= 480
                ? "SD"
                : "Low",
            url: `/api/stream?url=${encodeURIComponent(cleanUrl)}&format=bestvideo%5Bheight%3C%3D${h}%5D%2Bbestaudio%2Fbest%5Bheight%3C%3D${h}%5D&title=${encodeURIComponent(info.title || "video")}&ext=mp4`,
          });
        }
      }

      if (formats.length === 0) {
        formats.push({
          quality: "Best",
          label: "Auto",
          url: `/api/stream?url=${encodeURIComponent(cleanUrl)}&format=best&title=${encodeURIComponent(info.title || "video")}&ext=mp4`,
        });
      }
    }

    return res.json({
      title: info.title || "Unknown Title",
      thumbnail: info.thumbnail || "",
      duration: info.duration_string || "",
      uploader: info.uploader || "",
      platform: info.extractor_key || "",
      formats,
    });
  } catch (err) {
    console.error("[/api/download] error:", err.message);

    if (
      err.message?.includes("not found") ||
      err.message?.includes("'yt-dlp' is not recognized")
    ) {
      return res.status(500).json({
        error:
          "yt-dlp is not installed on the server. See setup instructions.",
      });
    }

    if (
      err.message?.includes("Private video") ||
      err.message?.includes("not available")
    ) {
      return res.status(422).json({
        error: "This video is private or unavailable.",
      });
    }

    return res.status(500).json({
      error:
        "Failed to process video. The URL may be private, age-restricted, or unsupported.",
    });
  }
});

app.get("/api/stream", async (req, res) => {
  const { url, format, title, ext } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required." });
  }

  const decodedUrl = decodeURIComponent(url);

  if (!isValidVideoUrl(decodedUrl)) {
    return res.status(400).json({ error: "Invalid URL." });
  }

  const safeFormat = typeof format === "string" ? format : "best";
  const safeTitle = sanitizeFilename(
    typeof title === "string" ? title : "download"
  );
  const safeExt = ["mp4", "mp3", "webm", "m4a"].includes(ext) ? ext : "mp4";
  const filename = `${safeTitle}.${safeExt}`;

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Transfer-Encoding", "chunked");

  const args = [
    "-f",
    safeFormat,
    "--no-playlist",
    "--no-warnings",
    "-o",
    "-",
    decodedUrl,
  ];

  const ytdlp = spawn("yt-dlp", args);

  ytdlp.stdout.pipe(res);

  ytdlp.stderr.on("data", (data) => {
    console.error("[stream stderr]", data.toString().trim());
  });

  ytdlp.on("error", (err) => {
    console.error("[stream spawn error]", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to start download stream." });
    }
  });

  ytdlp.on("close", (code) => {
    if (code !== 0 && !res.writableEnded) {
      console.error("[stream] yt-dlp exited with code", code);
    }
  });

  req.on("close", () => {
    ytdlp.kill("SIGTERM");
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 API server running -> http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
