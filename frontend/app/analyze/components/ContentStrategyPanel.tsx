"use client";

import { useEffect, useState } from "react";
import type { AnalysisJob } from "@/types/analysis";
import type { ContentStrategyState, SocialPlatformRecommendation, ContentPillar, SchedulePost } from "@/types/content";
import { getContentStrategy, createContentStrategy } from "../api/content";

const GOALS = [
  { id: "all_round_growth", label: "All-Round Growth", desc: "Balanced brand awareness, engagement & lead gen" },
  { id: "lead_generation", label: "Lead Generation", desc: "Convert attention into inbound inquiries & signups" },
  { id: "thought_leadership", label: "Authority & Trust", desc: "Founder insights, frameworks & case studies" },
  { id: "community_engagement", label: "Engagement & Community", desc: "Discussions, polls & behind-the-scenes" },
];

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  linkedin: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  instagram: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  "x (twitter)": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" },
  twitter: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" },
  x: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" },
  youtube: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  tiktok: { bg: "bg-neutral-900", text: "text-white", border: "border-neutral-800" },
  facebook: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  pinterest: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  threads: { bg: "bg-stone-100", text: "text-stone-800", border: "border-stone-300" },
};

export default function ContentStrategyPanel({ job }: { job: AnalysisJob | null }) {
  const [state, setState] = useState<ContentStrategyState | null>(null);
  const [loading, setLoading] = useState(!!job?.id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("all_round_growth");
  const [activeDayFilter, setActiveDayFilter] = useState<string>("All");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const id = job?.id;
  const busy = state?.status === "generating";

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    async function load() {
      try {
        const saved = await getContentStrategy(id!, controller.signal);
        if (controller.signal.aborted) return;
        setState(saved);
        setError("");
        if (saved?.focusGoal) setSelectedGoal(saved.focusGoal);
        if (saved?.status === "generating") timer = setTimeout(load, 2500);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load content strategy.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [id, busy]);

  async function generate() {
    if (!id) return;
    setSubmitting(true);
    setError("");
    try {
      const started = await createContentStrategy(id, selectedGoal);
      setState(started);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start content strategy generation.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyHook(text: string, index: number) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  }

  const result = state?.result;
  const days = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const filteredSchedule = result?.weeklySchedule
    ? activeDayFilter === "All"
      ? result.weeklySchedule
      : result.weeklySchedule.filter(s => s.day.toLowerCase() === activeDayFilter.toLowerCase())
    : [];

  return (
    <section className="space-y-6">
      {/* Control Card */}
      <div className="rounded-2xl border border-violet-100 bg-white p-6 sm:p-7 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">
            AI Content & Schedule Strategy
          </p>
          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
            Social Media Intelligence
          </span>
        </div>

        <h2 className="mt-2 text-xl font-bold text-slate-900">
          What content to make, where to post & optimal timing
        </h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
          The AI model analyzes your verified products, target audience personas, and brand voice to recommend
          the highest-converting social media platforms, content pillars, concrete post ideas, and an optimal weekly posting schedule.
        </p>

        {/* Goal Selector */}
        <div className="mt-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Select Your Primary Social Goal
          </label>
          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {GOALS.map(goal => (
              <button
                key={goal.id}
                type="button"
                onClick={() => setSelectedGoal(goal.id)}
                disabled={busy || submitting}
                className={`rounded-xl border p-3 text-left transition ${
                  selectedGoal === goal.id
                    ? "border-violet-600 bg-violet-50/80 shadow-xs ring-1 ring-violet-600"
                    : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <p className={`text-xs font-bold ${selectedGoal === goal.id ? "text-violet-900" : "text-slate-800"}`}>
                  {goal.label}
                </p>
                <p className="mt-1 text-[10px] text-slate-500 leading-tight">{goal.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={job?.status !== "completed" || busy || submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy || submitting ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Analyzing Business & Formulating Strategy…</span>
              </>
            ) : result ? (
              <span>Regenerate Content Strategy</span>
            ) : (
              <span>Generate Content & Posting Strategy</span>
            )}
          </button>

          {state?.updatedAt && (
            <span className="text-[11px] text-slate-400">
              Last synthesized: {new Date(state.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {job?.status !== "completed" && (
          <p className="mt-3 text-xs text-amber-600 font-medium">
            Run a website analysis above to unlock AI-driven social content and posting recommendations.
          </p>
        )}

        {busy && (
          <p role="status" className="mt-3 animate-pulse text-xs font-medium text-violet-700">
            The AI model is inspecting your products, audience pain points, and brand tone to build your custom schedule...
          </p>
        )}

        {(error || state?.error) && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {error || state?.error}
          </p>
        )}
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Executive Overview & Audience Behavior */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-violet-600 uppercase">Strategic Thesis</span>
                <h3 className="mt-0.5 text-base font-bold text-slate-900">Social Positioning & Audience Dynamics</h3>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                Verified AI Synthesis
              </span>
            </div>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Core Content Strategy</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-700 sm:text-sm">{result.summary}</p>
              </div>

              <div className="rounded-xl bg-violet-50/60 p-4 border border-violet-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600">Audience Consumption Habits</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-700 sm:text-sm">{result.targetAudienceInsights}</p>
              </div>
            </div>
          </div>

          {/* Platforms to Post On */}
          <div>
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recommended Social Media Platforms</h3>
                <p className="text-xs text-slate-500">Where your specific buyers spend time, when they browse, and what formats perform</p>
              </div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {result.platforms.length} PLATFORMS
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {result.platforms.map((p: SocialPlatformRecommendation) => {
                const color = PLATFORM_COLORS[p.platform.toLowerCase()] || {
                  bg: "bg-slate-100",
                  text: "text-slate-700",
                  border: "border-slate-200",
                };
                const priorityBadge =
                  p.priority === "primary"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : p.priority === "secondary"
                    ? "bg-sky-50 text-sky-700 border-sky-200"
                    : "bg-amber-50 text-amber-700 border-amber-200";

                return (
                  <div
                    key={p.platform}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:border-violet-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${color.bg} ${color.text} ${color.border}`}>
                          {p.platform}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${priorityBadge}`}>
                          {p.priority}
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-slate-600">{p.why}</p>

                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                        <div className="flex items-start justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-slate-500">Cadence:</span>
                          <span className="font-bold text-slate-800">{p.postingCadence}</span>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold text-slate-500">Best Days:</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.bestDays.map(d => (
                              <span key={d} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold text-slate-500">Optimal Time Windows:</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.bestTimeWindows.map(t => (
                              <span key={t} className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 border border-violet-100">
                                ⏰ {t}
                              </span>
                            ))}
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400 italic leading-snug">{p.timeRationale}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Formats:</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.recommendedFormats.map(fmt => (
                          <span key={fmt} className="rounded-full bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[10px] text-slate-600">
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Pillars (What Content to Make) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-violet-600 uppercase">Content Themes & Formats</span>
                <h3 className="mt-0.5 text-base font-bold text-slate-900">Strategic Content Pillars & Topic Angles</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                What to Create
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {result.contentPillars.map((pillar: ContentPillar) => (
                <div
                  key={pillar.name}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 sm:text-sm">{pillar.name}</h4>
                    <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                      {pillar.allocationPercent}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-violet-600 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, pillar.allocationPercent))}%` }}
                    />
                  </div>

                  <p className="mt-2.5 text-[11px] text-slate-600 leading-relaxed font-medium">
                    🎯 <span className="font-semibold text-slate-700">Goal:</span> {pillar.goal}
                  </p>

                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Content Formats:</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {pillar.contentTypes.map(ct => (
                        <span key={ct} className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {ct}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 border-t border-slate-200/60 pt-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sample Post Ideas:</p>
                    <ul className="mt-1.5 space-y-1.5">
                      {pillar.examplePostIdeas.map((idea, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug">
                          <span className="text-violet-500 shrink-0 font-bold">•</span>
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Posting Schedule (Calendar) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-violet-600 uppercase">Posting Schedule</span>
                <h3 className="mt-0.5 text-base font-bold text-slate-900">7-Day Weekly Publishing Calendar</h3>
              </div>
              {/* Day filter tabs */}
              <div className="flex flex-wrap gap-1">
                {days.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActiveDayFilter(d)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      activeDayFilter === d
                        ? "bg-violet-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {filteredSchedule.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  No scheduled posts for {activeDayFilter}. Try selecting &quot;All&quot; to view the complete week.
                </div>
              ) : (
                filteredSchedule.map((post: SchedulePost, idx: number) => {
                  const color = PLATFORM_COLORS[post.platform.toLowerCase()] || {
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                    border: "border-slate-200",
                  };
                  return (
                    <article
                      key={idx}
                      className="rounded-xl border border-slate-200/80 bg-white p-4 transition hover:border-violet-300 hover:shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white">
                            {post.day}
                          </span>
                          <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 border border-violet-100">
                            ⏰ {post.timeSlot}
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold border ${color.bg} ${color.text} ${color.border}`}>
                            {post.platform}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {post.contentType}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {post.pillar}
                        </span>
                      </div>

                      <h4 className="mt-2.5 text-xs font-bold text-slate-900 sm:text-sm">
                        {post.topic}
                      </h4>

                      <div className="mt-3 rounded-lg bg-amber-50/70 p-3 border border-amber-200/60">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                            Magnetic Opening Hook:
                          </span>
                          <button
                            type="button"
                            onClick={() => copyHook(post.hook, idx)}
                            className="text-[10px] font-semibold text-amber-900 hover:underline"
                          >
                            {copiedIndex === idx ? "✓ Copied!" : "Copy Hook ↗"}
                          </button>
                        </div>
                        <p className="mt-1 text-xs italic text-amber-950 font-medium">
                          &ldquo;{post.hook}&rdquo;
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600">Call to Action:</span>
                        <span className="rounded bg-slate-50 px-2 py-0.5 text-slate-700 border border-slate-200/60">
                          {post.callToAction}
                        </span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {/* Tactical Growth & Engagement Tips */}
          {result.growthTips && result.growthTips.length > 0 && (
            <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50/40 via-white to-violet-50/40 p-6 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🚀</span>
                <h3 className="text-sm font-bold text-slate-900">Tactical Growth & Distribution Playbook</h3>
              </div>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {result.growthTips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-xl bg-white/90 p-3 text-xs leading-relaxed text-slate-700 border border-indigo-50 shadow-2xs"
                  >
                    <span className="font-bold text-violet-600">0{idx + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
