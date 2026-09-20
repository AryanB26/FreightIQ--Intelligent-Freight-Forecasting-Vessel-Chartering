import type { Metadata } from "next";
import "./globals.css";
import "./globals-dark-overrides.css";

export const metadata: Metadata = {
  title: {
    default: "FreightIQ",
    template: "%s — FreightIQ",
  },
  description:
    "Intelligent Freight Forecasting & Vessel Chartering Decision Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('freightiq-theme');
                  if (stored === 'light' || stored === 'dark') {
                    document.documentElement.setAttribute('data-theme', stored);
                    document.documentElement.style.colorScheme = stored;
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
