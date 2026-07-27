function NavLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", href); window.dispatchEvent(new Event("popstate")); }} className={className}>
      {children}
    </a>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-zinc-100">
            <span className="text-blue-500">Slyx</span>Up
          </span>
          <div className="flex items-center gap-4">
            <NavLink href="/login" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Sign In</NavLink>
            <NavLink href="/login" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Get Started</NavLink>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-300 text-xs mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Fully managed URL shortener
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-zinc-100 leading-tight tracking-tight">
          Short links with
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-400">superpowers</span>
        </h1>
        <p className="text-zinc-400 text-lg mt-4 max-w-xl mx-auto leading-relaxed">
          Create, manage, and track your short URLs. Built on Cloudflare — fast, reliable, and globally distributed.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <NavLink href="/login" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-base">Start Free</NavLink>
          <NavLink href="/login" className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors text-base">Sign In</NavLink>
        </div>
        <p className="text-zinc-600 text-xs mt-3">No credit card required · Free plan: 10 URLs</p>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-100">Everything you need</h2>
          <p className="text-zinc-400 mt-2">Short links, analytics, and management in one place.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: "🔗", title: "Custom Slugs", desc: "Readable, branded short links with your own keywords. Available on Pro." },
            { icon: "📊", title: "Click Analytics", desc: "Track every click with detailed metrics. See where your traffic comes from." },
            { icon: "⚡", title: "Lightning Fast", desc: "Cloudflare Workers edge network — links resolve in milliseconds globally." },
            { icon: "🔒", title: "Secure by Default", desc: "Block malicious URLs, validate destinations, prevent phishing abuse." },
            { icon: "📱", title: "Works Everywhere", desc: "Share via email, SMS, social media — short links work on every platform." },
            { icon: "💳", title: "Simple Pricing", desc: "Free for 10 URLs, upgrade when you need more. No hidden fees." },
          ].map((f, i) => (
            <div key={i} className="p-5 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-zinc-100 font-semibold mt-3">{f.title}</h3>
              <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-100">How it works</h2>
          <p className="text-zinc-400 mt-2">Three simple steps to get started.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Create an account", desc: "Sign up free with email, Google, or GitHub. No credit card needed." },
            { step: "2", title: "Shorten your link", desc: "Paste a long URL, optionally add a custom slug and title." },
            { step: "3", title: "Share everywhere", desc: "Copy your short link and share it across email, social, or SMS." },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-lg">{s.step}</div>
              <h3 className="text-zinc-100 font-semibold mt-3">{s.title}</h3>
              <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-100">Simple pricing</h2>
          <p className="text-zinc-400 mt-2">Start free, upgrade when you need more.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
          <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
            <h3 className="text-zinc-100 font-semibold text-lg">Free</h3>
            <p className="text-3xl font-bold text-zinc-100 mt-2">$0</p>
            <p className="text-zinc-500 text-sm">Forever</p>
            <ul className="text-sm text-zinc-400 mt-4 space-y-2">
              {["10 URLs", "6-char auto slugs", "30-day expiry", "Standard support"].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <NavLink href="/login" className="mt-6 block w-full text-center p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">Start Free</NavLink>
          </div>
          <div className="p-6 bg-zinc-900 rounded-xl border border-amber-800/50 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-600 text-white text-xs font-medium">Popular</span>
            <h3 className="text-zinc-100 font-semibold text-lg">Pro</h3>
            <p className="text-3xl font-bold text-zinc-100 mt-2">$9<span className="text-sm font-normal text-zinc-500">/month</span></p>
            <p className="text-zinc-500 text-sm">Billed monthly</p>
            <ul className="text-sm text-zinc-400 mt-4 space-y-2">
              {["1,000 URLs", "Custom slugs", "No expiry", "Priority support"].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <NavLink href="/login" className="mt-6 block w-full text-center p-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors">Upgrade</NavLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-zinc-600 text-sm">
          SlyxUp URL Shortener · Built on Cloudflare Workers
        </div>
      </footer>
    </div>
  );
}
