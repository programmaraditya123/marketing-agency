import type { WebsiteSeoSummary } from "../types/seo";

function ProfileCard({ profile, isClient }: { profile: WebsiteSeoSummary; isClient: boolean }) {
  const scoreColor = profile.overallSeoHealthScore >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : profile.overallSeoHealthScore >= 60 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-rose-600 bg-rose-50 border-rose-200";

  return (
    <div className={`rounded-2xl border p-5 transition ${isClient ? "border-violet-200 bg-white" : "border-slate-200 bg-slate-50/60"}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isClient ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-700"}`}>
            {isClient ? "Your Website (Client)" : "Competitor Website"}
          </span>
          <p className="mt-1 truncate text-xs font-semibold text-slate-800 max-w-[220px]">{profile.url}</p>
        </div>
        <div className={`flex flex-col items-center justify-center rounded-xl border px-3 py-1.5 ${scoreColor}`}>
          <span className="text-base font-extrabold">{profile.overallSeoHealthScore}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">SEO Health</span>
        </div>
      </div>

      <div className="mt-4 space-y-3.5 text-xs">
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Meta Title</span>
            <span className={profile.titleLength > 60 || profile.titleLength < 30 ? "text-amber-600" : "text-emerald-600"}>
              {profile.titleLength} chars
            </span>
          </div>
          <p className="mt-1 font-medium text-slate-900 line-clamp-2">{profile.title || "Missing title tag"}</p>
          {profile.titleEvaluation && <p className="mt-0.5 text-[10px] text-slate-500 italic">{profile.titleEvaluation}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Meta Description</span>
            <span className={profile.descriptionLength > 160 || profile.descriptionLength < 100 ? "text-amber-600" : "text-emerald-600"}>
              {profile.descriptionLength} chars
            </span>
          </div>
          <p className="mt-1 text-slate-700 line-clamp-3">{profile.description || "Missing meta description"}</p>
          {profile.descriptionEvaluation && <p className="mt-0.5 text-[10px] text-slate-500 italic">{profile.descriptionEvaluation}</p>}
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500">H1 Tag</span>
          <p className="mt-1 text-slate-800 font-medium truncate">{profile.h1Tags[0] || "No H1 detected"}</p>
        </div>

        {!!profile.schemaTypes.length && (
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Schema Types</span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {profile.schemaTypes.map(st => (
                <span key={st} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">{st}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SeoScorecard({ client, competitor }: { client: WebsiteSeoSummary; competitor: WebsiteSeoSummary }) {
  return (
    <section aria-label="SEO Scorecard comparison" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Head-to-Head SEO Profile & Health Score</h3>
        <span className="text-[11px] text-slate-500">Objective on-page evaluation</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileCard profile={client} isClient={true} />
        <ProfileCard profile={competitor} isClient={false} />
      </div>
    </section>
  );
}
