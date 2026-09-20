"use client";

import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur px-6">
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Live Data
        </Badge>
        <span className="text-xs text-muted-foreground font-mono">
          {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>
    </header>
  );
}
