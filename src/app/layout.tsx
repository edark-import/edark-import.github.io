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
    <html lang="es" className={`${jakarta.variable} ${jetbrains.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('edark_theme')==='light'){document.documentElement.classList.remove('dark');}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col relative overflow-x-clip selection:bg-[#007BFF]/25">
        <div className="pointer-events-none fixed -top-32 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#007BFF]/20 blur-[120px]" />
        <div className="pointer-events-none fixed top-20 right-1/5 h-[26rem] w-[26rem] rounded-full bg-[#4DA3FF]/15 dark:bg-violet-500/15 blur-[120px]" />
        <Navbar />
        <main className="relative z-10 flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
