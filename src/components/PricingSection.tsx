import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: ["5 downloads/day", "Basic file conversion", "Standard quality", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For serious creators",
    features: [
      "Unlimited downloads",
      "All AI tools",
      "4K quality downloads",
      "Batch processing",
      "Priority support",
      "No ads",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$29",
    period: "/month",
    description: "For teams and agencies",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const PricingSection = () => (
  <section className="py-24 relative" id="pricing">
    <div className="container mx-auto px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Simple, transparent <span className="gradient-text">pricing</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Start free. Upgrade when you need more power.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={`relative p-8 rounded-2xl ${
              plan.highlighted
                ? "gradient-primary glow-primary"
                : "glass card-hover"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background text-primary text-xs font-semibold border border-primary/20">
                Most Popular
              </div>
            )}
            <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? "text-primary-foreground" : "text-foreground"}`}>
              {plan.name}
            </h3>
            <p className={`text-sm mb-4 ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {plan.description}
            </p>
            <div className="mb-6">
              <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-primary-foreground" : "text-foreground"}`}>
                {plan.price}
              </span>
              <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {plan.period}
              </span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className={`flex items-center gap-2 text-sm ${plan.highlighted ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                  <Check className="w-4 h-4 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className={`w-full font-semibold ${
                plan.highlighted
                  ? "bg-background text-foreground hover:bg-background/90"
                  : "gradient-primary text-primary-foreground hover-glow"
              }`}
            >
              {plan.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;
