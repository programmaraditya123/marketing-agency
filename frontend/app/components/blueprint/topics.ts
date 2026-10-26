import type { Analysis, AnalysisJob, Finding } from "@/types/analysis";
export type BlueprintDetail =
  | { type: "company"; company: Analysis["company"] }
  | { type: "finding"; finding: Finding }
  | { type: "product"; product: Analysis["products"][number] }
  | { type: "audience"; audience: Analysis["targetAudience"][number] }
  | { type: "findings"; findings: Finding[] }
  | { type: "list"; items: string[]; empty: string }
  | { type: "opportunity"; opportunity: Analysis["marketingOpportunities"][number] }
  | { type: "social"; links: AnalysisJob["socialLinks"] }
  | { type: "sources"; sources: AnalysisJob["sources"] };
export interface BlueprintTopic { id: string; label: string; detail: BlueprintDetail; count?: number; badge?: string }
export interface BlueprintGroup { title: string; description: string; topics: BlueprintTopic[]; empty?: string; tone: "violet" | "cyan" | "amber" }
export function buildBlueprintGroups(job: AnalysisJob, analysis: Analysis): BlueprintGroup[] {
  const finding = (id: string, label: string, value: Finding): BlueprintTopic => ({ id, label, detail: { type: "finding", finding: value } });
  return [
    { title: "The business", description: "Get to know the company.", tone: "violet", topics: [
      { id: "company", label: "Company overview", detail: { type: "company", company: analysis.company } },
      finding("industry", "Industry", analysis.company.industry), finding("business-model", "Business model", analysis.company.businessModel),
      finding("locations", "Locations", analysis.company.locations),
    ] },
    { title: "Products & services", description: "What the brand offers.", tone: "cyan", empty: "No products identified in the collected pages.",
      topics: analysis.products.map((product, index) => ({ id: `product-${index}`, label: product.name, detail: { type: "product", product } })) },
    { title: "Target audience", description: "Explore audience hypotheses and their needs.", tone: "violet", empty: "More customer information is needed to identify the audience.",
      topics: analysis.targetAudience.map((audience, index) => ({ id: `audience-${index}`, label: audience.segment, detail: { type: "audience", audience } })) },
    { title: "Brand positioning", description: "The value, voice and points of difference.", tone: "violet", topics: [
      finding("value", "Value proposition", analysis.positioning.valueProposition), finding("voice", "Brand voice", analysis.positioning.brandVoice),
      { id: "differences", label: "Differentiators", count: analysis.positioning.differentiators.length, detail: { type: "findings", findings: analysis.positioning.differentiators } },
    ] },
    { title: "Marketing direction", description: "Turn the research into next steps.", tone: "amber", topics: [
      { id: "themes", label: "Content themes", count: analysis.contentThemes.length, detail: { type: "list", items: analysis.contentThemes, empty: "No content themes identified yet." } },
      ...analysis.marketingOpportunities.map((opportunity, index): BlueprintTopic => ({ id: `opportunity-${index}`, label: opportunity.title, badge: `${opportunity.priority} priority`, detail: { type: "opportunity", opportunity } })),
    ] },
    { title: "Social & research", description: "Check the sources and fill in the gaps.", tone: "cyan", topics: [
      { id: "social", label: "Social presence", count: job.socialLinks.length, detail: { type: "social", links: job.socialLinks } },
      { id: "sources", label: "Pages explored", count: job.sources.length, detail: { type: "sources", sources: job.sources } },
      { id: "gaps", label: "Questions for your client", count: analysis.missingInformation.length, detail: { type: "list", items: analysis.missingInformation, empty: "No additional client questions identified." } },
      { id: "limits", label: "Research limitations", detail: { type: "list", items: [...new Set([...job.warnings, ...analysis.limitations])], empty: "No additional limitations recorded." } },
    ] },
  ];
}
