import type { Metadata, Viewport } from "next";
import Script from "next/script";
import {
  Inter,
  JetBrains_Mono,
  Noto_Sans_Bengali,
} from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PwaServiceWorkerRegistrar } from "@/components/layout/PwaInstallControl";
import { AiCircularAssistant } from "@/components/jobs/AiCircularAssistant";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bangla = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bangla-src",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SorkariPath — Bangladesh Govt Job Portal & A-to-Z Learning Academy",
  description:
    "Live Bangladesh Government Job circulars & notices synced from BPSC, Bangladesh Bank, MOPA & ministries, plus a complete A-to-Z career curriculum, MCQ practice arena & 2026 pay-scale tools.",
  applicationName: "SorkariPath",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SorkariPath",
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${bangla.variable} ${mono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-[#f6f8f7] text-slate-900"
      >
        <Script id="pwa-early-install-capture" strategy="beforeInteractive">
          {`window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__spDeferredInstallPrompt=e;});window.addEventListener("appinstalled",function(){window.__spDeferredInstallPrompt=null;});`}
        </Script>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <AiCircularAssistant />
        <PwaServiceWorkerRegistrar />
      </body>
    </html>
  );
}
