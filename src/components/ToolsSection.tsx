import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Video, Music, Image, MessageSquare, Hash, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const tools = [
  {
    slug: "video-downloader",
    icon: Video,
    name: "Video Downloader",
    description: "Download videos from YouTube, TikTok, Instagram & more",
    color: "from-red-500 to-orange-500",
  },
  {
    slug: "video-to-mp3",
    icon: Music,
    name: "Video to MP3",
    description: "Extract high-quality audio from any video URL",
    color: "from-green-500 to-emerald-500",
  },
  {
    slug: "image-converter",
    icon: Image,
    name: "Image Converter",
    description: "Convert images between PNG, JPG, WebP, and more",
    color: "from-blue-500 to-cyan-500",
  },
  {
    slug: "ai-caption-generator",
    icon: MessageSquare,
    name: "AI Caption Generator",
    description: "Generate engaging captions for your social posts with AI",
    color: "from-purple-500 to-pink-500",
  },
  {
    slug: "hashtag-generator",
    icon: Hash,
    name: "Hashtag Generator",
    description: "Get trending, relevant hashtags to boost your reach",
    color: "from-yellow-500 to-orange-500",
  },
  {
    slug: "thumbnail-maker",
    icon: FileText,
    name: "Thumbnail Maker",
    description: "Create eye-catching thumbnails for YouTube & social media",
    color: "from-indigo-500 to-violet-500",
  },
];

const ToolsSection = () => (
  <section className="py-24 relative">
    <div className="container mx-auto px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          All your <span className="gradient-text">tools</span> in one place
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          From downloading to AI generation — everything a creator needs.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
          >
            <Link
              to={`/tools/${tool.slug}`}
              className="block p-6 rounded-2xl glass card-hover group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <tool.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{tool.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{tool.description}</p>
              <Button variant="ghost" className="text-primary hover:text-primary p-0 h-auto text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                Use Tool →
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ToolsSection;
