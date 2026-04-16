import { motion } from "framer-motion";
import { Zap, Shield, Globe, Cpu, Download, Palette } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process videos and files in seconds with our optimized infrastructure.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your files are never stored. Everything is processed and deleted instantly.",
  },
  {
    icon: Globe,
    title: "All Platforms",
    description: "Works with YouTube, TikTok, Instagram, Twitter, and 100+ more sites.",
  },
  {
    icon: Cpu,
    title: "AI-Powered",
    description: "Generate captions, hashtags, and thumbnails using cutting-edge AI models.",
  },
  {
    icon: Download,
    title: "Batch Processing",
    description: "Download and convert multiple files at once. No limits on free tier.",
  },
  {
    icon: Palette,
    title: "Creator-First",
    description: "Built by creators, for creators. Every tool is optimized for your workflow.",
  },
];

const FeaturesSection = () => (
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
          Why creators choose <span className="gradient-text">CreatorKit</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Everything you need to create, convert, and grow — in one platform.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="group p-6 rounded-2xl glass card-hover cursor-default"
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <feature.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
