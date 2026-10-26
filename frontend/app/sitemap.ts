import type { MetadataRoute } from "next";
import { site } from "@/config/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/how-it-works`, changeFrequency: "monthly", priority: 0.8 }];
}
