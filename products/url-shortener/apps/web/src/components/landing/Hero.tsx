import { ArrowRight, Zap } from "lucide-react";
import { Button } from "../ui/Button";

function NavLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, "", href);
        window.dispatchEvent(new Event("popstate"));
      }}
      className={className}
    >
      {children}
    </a>
  );
}

export function Hero() {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 text-center overflow-hidden">
      <div className="absolute inset-0 bg-glow pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/20 border border-blue-800/30 text-blue-300 text-xs mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <Zap className="w-3 h-3" />
          Fully managed URL shortener on Cloudflare
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-zinc-100 leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
          Short links with
          <br />
          <span className="text-gradient">superpowers</span>
        </h1>

        <p className="text-zinc-400 text-lg sm:text-xl mt-6 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Create, manage, and track your short URLs at the edge.
          Built on Cloudflare — lightning fast, globally distributed, and dead simple.
        </p>

        <div className="flex items-center justify-center gap-4 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <NavLink href="/login">
            <Button size="lg" className="gap-2">
              Start Free <ArrowRight className="w-4 h-4" />
            </Button>
          </NavLink>
          <NavLink href="/login">
            <Button variant="secondary" size="lg">Sign In</Button>
          </NavLink>
        </div>

        <p className="text-zinc-600 text-xs mt-4">No credit card required · Free plan: 10 URLs</p>
      </div>
    </section>
  );
}
