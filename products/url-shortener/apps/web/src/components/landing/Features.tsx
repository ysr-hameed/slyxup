import { Sparkles, BarChart3, Zap, Shield, Globe, CreditCard } from "lucide-react";
import { Card } from "../ui/Card";

const features = [
  { icon: Sparkles, title: "Custom Slugs", desc: "Readable, branded short links with your own keywords. Available on Pro." },
  { icon: BarChart3, title: "Click Analytics", desc: "Track every click with detailed metrics. See where your traffic comes from." },
  { icon: Zap, title: "Lightning Fast", desc: "Cloudflare Workers edge network — links resolve in milliseconds globally." },
  { icon: Shield, title: "Secure by Default", desc: "Block malicious URLs, validate destinations, prevent phishing abuse." },
  { icon: Globe, title: "Works Everywhere", desc: "Share via email, SMS, social media — short links work on every platform." },
  { icon: CreditCard, title: "Simple Pricing", desc: "Free for 10 URLs, upgrade when you need more. No hidden fees." },
];

export function Features() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100">Everything you need</h2>
          <p className="text-zinc-400 mt-3 text-lg">Short links, analytics, and management in one place.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Card key={i} hover className="p-6 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-800/20 flex items-center justify-center mb-4 group-hover:from-blue-600/30 group-hover:to-indigo-600/30 transition-all duration-300">
                <f.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-zinc-100 font-semibold">{f.title}</h3>
              <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
