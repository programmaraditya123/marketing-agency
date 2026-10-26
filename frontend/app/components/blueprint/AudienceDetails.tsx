import type { Analysis } from "@/types/analysis";
import FindingView from "../FindingView";
import { DetailList } from "../ReportSection";
export default function AudienceDetails({ audience }: { audience: Analysis["targetAudience"][number] }) {
  return <div className="space-y-7"><p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">Audience segments and channel recommendations are research hypotheses unless directly stated on the website. They are not verified customer demographics.</p><FindingView label="Who they are" finding={audience.description} /><div className="grid gap-7 sm:grid-cols-2"><DetailList title="Needs" values={audience.needs} /><DetailList title="Pain points" values={audience.painPoints} /><DetailList title="Buying triggers" values={audience.buyingTriggers} /><DetailList title="Suggested channels" values={audience.suggestedChannels} /></div></div>;
}
