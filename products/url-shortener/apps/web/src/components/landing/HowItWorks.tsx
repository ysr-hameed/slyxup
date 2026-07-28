import { UserPlus, Link, Share2 } from "lucide-react";

const steps = [
  { icon: UserPlus, step: "1", title: "Create an account", desc: "Sign up free with email, Google, or GitHub. No credit card needed." },
  { icon: Link, step: "2", title: "Shorten your link", desc: "Paste a long URL, optionally add a custom slug and title." },
  { icon: Share2, step: "3", title: "Share everywhere", desc: "Copy your short link and share it across email, social, or SMS." },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 bg-zinc-900/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100">How it works</h2>
          <p className="text-zinc-400 mt-3 text-lg">Three simple steps to get started.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="text-center group">
              <div className="relative inline-flex">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                  {s.step}
                </div>
              </div>
              <h3 className="text-zinc-100 font-semibold mt-5 text-lg">{s.title}</h3>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
