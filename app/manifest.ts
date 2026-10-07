import type { MetadataRoute } from "next";

/** Lets phones and tablets "Add to Home Screen" and open NEXUS as a standalone app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXUS Protocol",
    short_name: "NEXUS",
    description: "Live crypto prices, new coins, NFTs, prediction odds and news — in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
