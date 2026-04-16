import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      navigate(`/tools/video-downloader?url=${encodeURIComponent(url)}`);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-sm text-muted-foreground mb-8"
          >
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>Powered by AI — Free to use</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            The Ultimate{" "}
            <span className="gradient-text">Creator</span>
            <br />
            Toolkit
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Download videos, convert files, generate captions, and supercharge your content — all from one blazing-fast platform.
          </p>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="flex items-center gap-2 p-2 rounded-2xl glass border border-border focus-within:border-primary/40 transition-colors duration-300 focus-within:glow-primary">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Play className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a video URL to get started..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm md:text-base outline-none py-2"
                />
              </div>
              <Button
                type="submit"
                className="gradient-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl hover-glow shrink-0"
              >
                <span className="hidden sm:inline">Download</span>
                <ArrowRight className="w-4 h-4 sm:ml-2" />
              </Button>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            {["YouTube", "TikTok", "Instagram", "Twitter"].map((platform) => (
              <span key={platform} className="opacity-60 hover:opacity-100 transition-opacity cursor-default">
                {platform}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
