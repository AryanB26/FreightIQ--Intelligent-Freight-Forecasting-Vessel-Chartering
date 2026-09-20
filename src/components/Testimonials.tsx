import { Card, CardHeader, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "FlowSync cut our deployment pipeline from 45 minutes to 3. Our team ships features twice as fast now.",
    name: "Sarah Chen",
    role: "VP of Engineering, CloudBase",
    avatar: "SC",
  },
  {
    quote:
      "We replaced five different tools with FlowSync. The ROI was obvious within the first month.",
    name: "Marcus Rivera",
    role: "CTO, DataPulse",
    avatar: "MR",
  },
  {
    quote:
      "The automation builder is incredibly intuitive. Our non-technical team members can create workflows without any help.",
    name: "Aisha Patel",
    role: "Head of Ops, NexaHealth",
    avatar: "AP",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Loved by engineering teams
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See why thousands of teams trust FlowSync for their critical workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="flex flex-col">
              <CardHeader>
                {/* Stars */}
                <div className="flex gap-1 mb-2 text-accent">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <blockquote className="flex-1 text-foreground leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-heading font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-heading font-semibold text-sm text-foreground">
                      {t.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
