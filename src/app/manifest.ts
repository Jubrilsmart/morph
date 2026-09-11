import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Morph — Offline File Converter",
    short_name: "Morph",
    description:
      "The zero-overhead offline media compiler. Convert video, images and documents entirely on your device.",
    start_url: "/tools",
    display: "standalone",
    background_color: "#0d0d13",
    theme_color: "#6d5cf0",
    orientation: "any",
    categories: ["utilities", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
