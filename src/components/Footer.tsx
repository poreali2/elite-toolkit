import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "Video Downloader", href: "/tools/video-downloader" },
    { label: "Video to MP3", href: "/tools/video-to-mp3" },
    { label: "Image Converter", href: "/tools/image-converter" },
    { label: "AI Captions", href: "/tools/ai-caption-generator" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

const Footer = () => (
  <footer className="border-t border-border bg-card/30">
    <div className="container mx-auto px-4 md:px-8 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              Creator<span className="gradient-text">Kit</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            The all-in-one toolkit for creators. Download, convert, generate — all in one place.
          </p>
        </div>

        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CreatorKit. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {["Twitter", "GitHub", "Discord"].map((social) => (
            <a
              key={social}
              href="#"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {social}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
