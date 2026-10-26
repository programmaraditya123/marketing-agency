import type { BlueprintDetail } from "./topics";
import FindingView from "../FindingView";
import { DetailList } from "../ReportSection";
import AudienceDetails from "./AudienceDetails";
import { SocialDetails, SourcesDetails } from "./ResearchDetails";
import SourceLinks from "./SourceLinks";
export default function BlueprintDetails({ detail }: { detail: BlueprintDetail }) {
  switch (detail.type) {
    case "company": return <div className="space-y-7"><FindingView label="Company name" finding={detail.company.name} /><FindingView label="What they do" finding={detail.company.summary} /><div className="grid gap-7 sm:grid-cols-2"><FindingView label="Industry" finding={detail.company.industry} /><FindingView label="Business model" finding={detail.company.businessModel} /><FindingView label="Locations" finding={detail.company.locations} /></div></div>;
    case "finding": return <FindingView finding={detail.finding} />;
    case "product": return <div className="space-y-7"><span className="inline-flex rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-900">{detail.product.category}</span><FindingView label="Overview" finding={detail.product.description} /><DetailList title="Benefits" values={detail.product.benefits} /><div className="rounded-2xl bg-slate-50 p-5"><FindingView label="Pricing" finding={detail.product.pricing} /></div></div>;
    case "audience": return <AudienceDetails audience={detail.audience} />;
    case "findings": return <div className="space-y-6">{detail.findings.length ? detail.findings.map((finding, index) => <div key={index} className="rounded-2xl border border-slate-200 p-5"><FindingView label={`Differentiator ${index + 1}`} finding={finding} /></div>) : <p className="text-sm leading-7 text-slate-500">No clear differentiators identified in the website evidence.</p>}</div>;
    case "list": return detail.items.length ? <ul className="space-y-3">{detail.items.map((item, index) => <li key={index} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" /><p className="text-sm leading-7 text-slate-700">{item}</p></li>)}</ul> : <p className="text-sm leading-7 text-slate-500">{detail.empty}</p>;
    case "opportunity": return <div className="space-y-6"><span className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold capitalize text-amber-900">{detail.opportunity.priority} priority</span><div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Why it matters</h3><p className="text-base leading-8 text-slate-700">{detail.opportunity.rationale}</p></div><div className="rounded-2xl bg-violet-50 p-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-700">Suggested action</h3><p className="text-base leading-8 text-violet-950">{detail.opportunity.suggestedAction}</p></div><SourceLinks urls={detail.opportunity.evidenceUrls} /></div>;
    case "social": return <SocialDetails links={detail.links} />;
    case "sources": return <SourcesDetails sources={detail.sources} />;
  }
}
