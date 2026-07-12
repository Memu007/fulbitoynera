import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";


export const metadata: Metadata = {
  title: "Pizarra Pro — Táctica de fútbol con IA",
  description: "Pizarra táctica para entrenadores: grabá jugadas, reproducilas a velocidad real y dejá que la IA complete los movimientos del resto del equipo. Fútbol 5, 8 y 11.",
  keywords: ["pizarra táctica", "fútbol", "entrenador", "tactica", "IA", "jugadas", "formaciones"],
  authors: [{ name: "Pizarra Pro" }],
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-180.png",
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
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
