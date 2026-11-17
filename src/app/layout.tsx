import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "eDark | Servicios Tecnológicos, Consultoría & PC a Medida en Perú",
    template: "%s | eDark",
  },
  description:
    "Consultoría TI, asesoramiento empresarial B2B y hogar, soporte técnico inmediato, mantenimiento, armado de PCs personalizadas y reciclaje R2v3 en Perú.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="font-sans bg-[#070b14] text-slate-200 min-h-screen flex flex-col">
        <div className="pointer-events-none fixed inset-0 bg-edark-grid opacity-60" />
        <Navbar />
        <main className="relative z-10 flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
