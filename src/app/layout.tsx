import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pizarra Pro — Táctica de fútbol con IA",
  description: "Pizarra táctica para entrenadores: grabá jugadas, reproducilas a velocidad real y dejá que la IA complete los movimientos del resto del equipo. Fútbol 5, 8 y 11.",
  keywords: ["pizarra táctica", "fútbol", "entrenador", "tactica", "IA", "jugadas", "formaciones"],
  authors: [{ name: "Pizarra Pro" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Pizarra Pro",
    description: "Táctica de fútbol con IA: grabá, reproducí y completá jugadas.",
    siteName: "Pizarra Pro",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
