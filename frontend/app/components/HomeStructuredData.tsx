import { site } from "@/config/site";
export default function HomeStructuredData() {
  const data = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": `${site.url}/#organization`, name: site.name, url: site.url,
      logo: `${site.url}/brand/orbit-logo.png`, parentOrganization: { "@type": "Organization", name: "VidoraHub", url: "https://www.vidorahub.com/" } },
    { "@type": "WebSite", "@id": `${site.url}/#website`, name: site.name, url: site.url,
      description: site.description, publisher: { "@id": `${site.url}/#organization` }, inLanguage: "en" },
    { "@type": "WebApplication", name: site.name, url: site.url, description: site.description,
      applicationCategory: "BusinessApplication", operatingSystem: "Web", publisher: { "@id": `${site.url}/#organization` },
      featureList: ["Website brand analysis", "Product and service research", "Target audience insights", "Evidence-linked marketing opportunities"] },
  ] };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
