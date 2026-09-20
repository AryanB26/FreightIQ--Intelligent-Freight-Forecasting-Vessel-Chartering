import { TopNav } from "@/components/layout/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopNav />
      <div className="pt-12 min-h-screen flex flex-col">
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
