import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SorkariPath — BD Govt Job Portal & Academy",
    short_name: "SorkariPath",
    description:
      "Live Bangladesh Government Job circulars synced from BPSC, Bangladesh Bank, MOPA & ministries, plus 50 Topic Guru sheets, 814+ solved MCQs, and 2026 Pay Scale tools.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    launch_handler: {
      client_mode: "focus-existing",
    },
    background_color: "#f6f8f7",
    theme_color: "#047857",
    categories: ["education", "reference", "productivity"],
    icons: [
      {
        src: "/pwa-icon/192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Live Circulars",
        short_name: "Circulars",
        url: "/jobs",
      },
      {
        name: "Study Hub",
        short_name: "Study Hub",
        url: "/study",
      },
      {
        name: "Past Job Solutions",
        short_name: "Archives",
        url: "/practice?mode=archive",
      },
      {
        name: "2026 Pay & Age Tools",
        short_name: "Tools",
        url: "/tools",
      },
    ],
  };
}
