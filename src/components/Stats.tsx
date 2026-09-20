const stats = [
  { value: "12,000+", label: "Teams using FlowSync" },
  { value: "2.4M", label: "Workflows executed daily" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "4.9/5", label: "Customer satisfaction" },
];

export default function Stats() {
  return (
    <section className="py-20 bg-primary/5">
      <div className="mx-auto max-w-6xl px-6">
        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-heading text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
