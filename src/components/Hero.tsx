import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Background gradient blobs */}
      <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        {/* Badge */}
        <Badge variant="secondary" className="mb-8 inline-flex items-center gap-2 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Now in public beta — try FlowSync free
        </Badge>

        {/* Headline */}
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]">
          Automate your workflow.
          <br />
          <span className="text-primary">Ship 10x faster.</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          FlowSync connects your tools, automates repetitive tasks, and gives your
          team a single source of truth — so you can focus on building what matters.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild>
            <a href="#pricing">Start Free Trial</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#features">See How It Works</a>
          </Button>
        </div>

        {/* Hero visual - Dashboard mockup */}
        <div className="mt-16 mx-auto max-w-4xl">
          <div className="glass rounded-2xl p-1 shadow-2xl shadow-primary/10">
            <div className="rounded-xl bg-white overflow-hidden border border-border">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-4 flex-1 rounded-lg bg-white border border-border px-3 py-1 text-xs text-muted-foreground">
                  app.flowsync.io/dashboard
                </div>
              </div>
              {/* Dashboard content */}
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-4">
                  <div className="h-4 w-1/3 rounded bg-primary/20" />
                  <div className="h-32 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/10 flex items-center justify-center">
                    <div className="flex items-end gap-2 h-16">
                      {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                        <div
                          key={i}
                          className="w-6 rounded-t bg-primary/40"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-20 flex-1 rounded-xl bg-muted" />
                    <div className="h-20 flex-1 rounded-xl bg-muted" />
                    <div className="h-20 flex-1 rounded-xl bg-muted" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary/40" />
                        <div className="h-2 flex-1 rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
