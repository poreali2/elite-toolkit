import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const posts = [
  {
    title: "How to Download YouTube Videos in 4K Quality",
    excerpt: "A step-by-step guide to downloading YouTube videos in the highest quality possible using CreatorKit.",
    date: "Apr 12, 2026",
    tag: "Tutorial",
  },
  {
    title: "10 AI Tools Every Content Creator Needs in 2026",
    excerpt: "Discover the must-have AI tools that are transforming content creation this year.",
    date: "Apr 8, 2026",
    tag: "AI",
  },
  {
    title: "Convert Videos to MP3: The Complete Guide",
    excerpt: "Learn how to extract audio from videos quickly and maintain the best audio quality.",
    date: "Apr 3, 2026",
    tag: "Guide",
  },
];

const BlogSection = () => (
  <section className="py-24 relative">
    <div className="container mx-auto px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex items-end justify-between mb-12"
      >
        <div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            From the <span className="gradient-text">blog</span>
          </h2>
          <p className="text-muted-foreground text-lg">Tips, tutorials, and updates for creators.</p>
        </div>
        <Link to="/blog" className="hidden md:flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all duration-200 font-medium">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post, i) => (
          <motion.article
            key={post.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="group p-6 rounded-2xl glass card-hover cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {post.tag}
              </span>
              <span className="text-xs text-muted-foreground">{post.date}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-200 leading-snug">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

export default BlogSection;
