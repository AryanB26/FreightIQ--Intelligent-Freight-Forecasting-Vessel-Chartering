const logos = [
  { name: "Vercel", width: "w-20" },
  { name: "Stripe", width: "w-16" },
  { name: "Notion", width: "w-18" },
  { name: "Linear", width: "w-16" },
  { name: "Figma", width: "w-14" },
  { name: "GitHub", width: "w-16" },
];

export default function LogoCloud() {
  return (
    <section className="py-16 border-t border-border/50">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8">
          Trusted by forward-thinking teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200"
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground/70">
                  {logo.name.charAt(0)}
                </span>
              </div>
              <span className="font-heading font-semibold text-sm">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
