import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="glass-dark rounded-3xl px-8 py-16 text-center md:px-16 relative overflow-hidden">
          {/* Background accents */}
          <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your workflow?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Join 12,000+ teams already using FlowSync to ship faster and
              collaborate better.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-accent text-on-accent hover:bg-accent/90 shadow-lg shadow-accent/25"
                asChild
              >
                <a href="#">Start Free Trial</a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <a href="#">Talk to Sales</a>
              </Button>
            </div>

            <p className="mt-6 text-sm text-white/50">
              No credit card required · Free 14-day trial · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
