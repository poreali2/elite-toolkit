import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Download,
  Copy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Music,
  Video,
  Clock,
  User,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { tools } from "@/components/ToolsSection";

type ProcessingState = "idle" | "loading" | "success" | "error";

interface VideoFormat {
  quality?: string;
  label?: string;
  type?: string;
  url: string;
}

interface VideoResult {
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  platform: string;
  formats: VideoFormat[];
}

const PLATFORM_LABELS: Record<string, string> = {
  Youtube: "YouTube",
  TikTok: "TikTok",
  Instagram: "Instagram",
};

const ToolPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tool = tools.find((t) => t.slug === slug);

  const [input, setInput] = useState(searchParams.get("url") || "");
  const [state, setState] = useState<ProcessingState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<VideoResult | null>(null);
  const [copied, setCopied] = useState(false);

  const isUrlTool = ["video-downloader", "video-to-mp3"].includes(slug ?? "");
  const isTextTool = ["ai-caption-generator", "hashtag-generator"].includes(slug ?? "");
  const isMp3Tool = slug === "video-to-mp3";

  if (!tool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Tool not found.</p>
      </div>
    );
  }

  const handleProcess = async () => {
    if (!input.trim()) return;

    setState("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: input.trim(),
          type: isMp3Tool ? "mp3" : "video",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        setState("error");
        return;
      }

      setResult(data);
      setState("success");
    } catch {
      setErrorMessage(
        "Could not connect to the server. Make sure the backend is running."
      );
      setState("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleProcess();
  };

  const handleCopyLink = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setErrorMessage("");
    setInput("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center`}
              >
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {tool.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            </div>

            {/* Input area */}
            <div className="p-6 rounded-2xl glass mb-6">
              {isUrlTool && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        isMp3Tool
                          ? "Paste YouTube or TikTok URL to extract MP3..."
                          : "Paste YouTube, TikTok, or Instagram URL..."
                      }
                      className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/40 transition-colors"
                      disabled={state === "loading"}
                    />
                    <Button
                      onClick={handleProcess}
                      disabled={state === "loading" || !input.trim()}
                      className="gradient-primary text-primary-foreground font-semibold px-6 rounded-xl hover-glow"
                    >
                      {state === "loading" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> YouTube
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> TikTok
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Instagram
                    </span>
                  </div>
                </div>
              )}

              {isTextTool && (
                <div className="space-y-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      slug === "ai-caption-generator"
                        ? "Describe your post or paste your content..."
                        : "Enter your topic or niche..."
                    }
                    rows={4}
                    className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/40 transition-colors resize-none"
                  />
                  <Button
                    onClick={handleProcess}
                    disabled={state === "loading" || !input.trim()}
                    className="gradient-primary text-primary-foreground font-semibold px-8 rounded-xl hover-glow"
                  >
                    {state === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
              )}

              {!isUrlTool && !isTextTool && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer">
                    <p className="text-sm text-muted-foreground">
                      Drop your file here or{" "}
                      <span className="text-primary font-medium">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WebP up to 10MB
                    </p>
                  </div>
                  <Button
                    onClick={handleProcess}
                    disabled={state === "loading"}
                    className="gradient-primary text-primary-foreground font-semibold px-8 rounded-xl hover-glow"
                  >
                    {state === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Converting...
                      </>
                    ) : (
                      "Convert"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Loading */}
            <AnimatePresence>
              {state === "loading" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-6 rounded-2xl glass text-center"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Fetching video info...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This may take a few seconds
                  </p>
                  <div className="mt-4 h-1.5 bg-secondary rounded-full overflow-hidden max-w-xs mx-auto">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 4, ease: "easeOut" }}
                      className="h-full gradient-primary rounded-full"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {state === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-5 rounded-2xl glass border border-destructive/30 bg-destructive/5"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Failed to process video
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="mt-3 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Try again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {state === "success" && result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Video info card */}
                  <div className="p-5 rounded-2xl glass">
                    <div className="flex items-start gap-4">
                      {result.thumbnail && (
                        <div className="relative shrink-0">
                          <img
                            src={result.thumbnail}
                            alt={result.title}
                            className="w-28 h-20 object-cover rounded-xl border border-border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          {isMp3Tool && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                              <Music className="w-6 h-6 text-white" />
                            </div>
                          )}
                          {!isMp3Tool && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-2 mb-2">
                          {result.title}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {result.uploader && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {result.uploader}
                            </span>
                          )}
                          {result.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {result.duration}
                            </span>
                          )}
                          {result.platform && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {PLATFORM_LABELS[result.platform] ?? result.platform}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download formats */}
                  <div className="p-5 rounded-2xl glass space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <p className="text-sm font-semibold text-foreground">
                        {isMp3Tool ? "Audio ready" : "Choose quality"}
                      </p>
                    </div>

                    {result.formats.map((fmt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/60 border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              fmt.type === "mp3"
                                ? "bg-green-500/15 text-green-500"
                                : "bg-primary/15 text-primary"
                            }`}
                          >
                            {fmt.type === "mp3" ? (
                              <Music className="w-4 h-4" />
                            ) : (
                              <Video className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {fmt.quality || fmt.type?.toUpperCase()}
                            </p>
                            {fmt.label && (
                              <p className="text-xs text-muted-foreground">
                                {fmt.label}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(fmt.url)}
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            title="Copy download link"
                          >
                            {copied ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <a
                            href={fmt.url}
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg gradient-primary text-primary-foreground hover-glow transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="w-full mt-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Download another video
                    </Button>
                  </div>

                  {/* Upgrade prompt */}
                  <div className="p-4 rounded-2xl glass border border-primary/20 bg-primary/5">
                    <p className="text-sm text-foreground font-medium mb-1">
                      Want 4K quality & no limits?
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upgrade to Pro for unlimited downloads, 4K quality, and
                      batch processing.
                    </p>
                    <Button
                      size="sm"
                      className="gradient-primary text-primary-foreground text-xs font-semibold hover-glow"
                    >
                      Upgrade to Pro — $9/mo
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ToolPage;
