import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const cosquinFont = localFont({
  src: "./fonts/CosquinDisplay.ttf",
  variable: "--font-cosquin",
  display: "swap",
});

const meloriac = localFont({
  src: "./fonts/Meloriac.ttf",
  variable: "--font-meloriac",
  display: "swap",
});

const circular = localFont({
  src: "./fonts/Circular.otf",
  variable: "--font-circular",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Armá tu grilla",
  description: "Cosquín Rock 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${cosquinFont.variable} ${circular.variable} ${meloriac.variable} ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
