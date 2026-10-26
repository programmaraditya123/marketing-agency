import type { MetadataRoute } from "next";
import { site } from "@/config/site";
export default function manifest(): MetadataRoute.Manifest {
  return { name: site.name, short_name: "Orbit", description: site.description, start_url: "/",
    display: "standalone", background_color: "#080b19", theme_color: "#080b19",
    icons: [{ src: "/brand/orbit-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/orbit-512.png", sizes: "512x512", type: "image/png" }] };
}
