"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function useCurrentTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const getTheme = (): "dark" | "light" => {
      if (typeof document === "undefined") return "dark";
      const docTheme = document.documentElement.getAttribute("data-theme");
      if (docTheme === "light" || docTheme === "dark") return docTheme;
      const stored = localStorage.getItem("freightiq-theme");
      if (stored === "light" || stored === "dark") return stored;
      return "dark";
    };

    setTheme(getTheme());

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<"dark" | "light">;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      } else {
        setTheme(getTheme());
      }
    };

    window.addEventListener("freightiq-theme-change", handleThemeChange);

    const observer = new MutationObserver(() => {
      setTheme(getTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener("freightiq-theme-change", handleThemeChange);
      observer.disconnect();
    };
  }, []);

  return theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("freightiq-theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
      document.documentElement.style.colorScheme = stored;
    } else {
      // Default to dark mode
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.colorScheme = "dark";
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("freightiq-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("freightiq-theme-change", { detail: nextTheme }));
    }
  }

  // Prevent hydration mismatch while keeping default layout clean
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="p-1.5 rounded-md transition-all duration-150 border flex items-center justify-center"
        style={{
          background: "var(--color-bg-raised)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-primary)",
        }}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="p-1.5 rounded-md transition-all duration-150 border flex items-center justify-center hover:opacity-90 active:scale-95 cursor-pointer"
      style={{
        background: "var(--color-bg-raised)",
        borderColor: "var(--color-border)",
        color: "var(--color-text-primary)",
      }}
    >
      {theme === "dark" ? (
        <Sun className="w-3.5 h-3.5 text-amber-400 hover:text-amber-300 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-slate-700 hover:text-slate-900 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
