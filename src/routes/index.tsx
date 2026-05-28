import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, Zap, BarChart3, Users, Brain } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session && role) {
      navigate({ to: role === "admin" ? "/admin" : "/worker" });
    }
  }, [session, role, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">P</div>
            <div>
              <div className="font-bold tracking-tight">PENFLEX</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Support System</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/auth" search={{ mode: "login" }}><Button variant="ghost">Login</Button></Link>
            <Link to="/auth" search={{ mode: "register" }}><Button>Register</Button></Link>
          </div>
        </div>
      </header>

      <section className="px-6 py-20 md:py-28">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered classification
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
              Smart Ticket <span className="text-primary">Classification</span> & Support Management
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Streamline workplace requests with an intelligent system that auto-classifies, routes,
              and resolves tickets across HR, IT, Finance, and Operations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "register" }}>
                <Button size="lg" className="shadow-soft">Get started — it's free</Button>
              </Link>
              <Link to="/auth" search={{ mode: "login" }}>
                <Button size="lg" variant="outline">Sign in</Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-accent shadow-soft p-8 grid grid-cols-2 gap-4">
              {[
                { icon: Brain, label: "AI Routing", val: "98%" },
                { icon: Zap, label: "Avg resolve", val: "2.1h" },
                { icon: Users, label: "Active workers", val: "1.2k" },
                { icon: BarChart3, label: "Tickets/mo", val: "5.4k" },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="bg-card rounded-2xl p-5 shadow-card flex flex-col justify-between">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">{s.val}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold">Built for modern workplaces</h2>
            <p className="mt-3 text-muted-foreground">Everything teams need to handle support requests, end-to-end.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "AI Classification", body: "Smart engine auto-categorises tickets into HR, IT, Finance, or Operations." },
              { icon: Shield, title: "Role-Based Access", body: "Separate dashboards for workers and admins with secure authentication." },
              { icon: Zap, title: "Real-Time Updates", body: "Live ticket status, instant replies, and live activity feed." },
              { icon: BarChart3, title: "Analytics Dashboard", body: "Track tickets per department, resolution time, and team load." },
              { icon: Users, title: "Worker Profiles", body: "Capture employee ID, department, and contact info on every ticket." },
              { icon: Sparkles, title: "Modern UI", body: "Clean brown & white design with dark mode and mobile support." },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-card rounded-2xl p-6 shadow-card border border-border hover:shadow-soft transition-shadow">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to simplify support?</h2>
          <p className="mt-3 text-muted-foreground">Join PENFLEX and let AI handle the routing.</p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link to="/auth" search={{ mode: "register" }}><Button size="lg">Create account</Button></Link>
            <Link to="/auth" search={{ mode: "login" }}><Button size="lg" variant="outline">Login</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} PENFLEX. Smart Ticket Classification & Support Management System.
      </footer>
    </div>
  );
}
