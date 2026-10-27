import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import Icon from "./WorkspaceIcon";

export const sections = [
  { label: "Brand Overview", icon: "overview", group: "YOUR RESEARCH" },
  { label: "Your Product", icon: "product" },
  { label: "Target Audience", icon: "audience" },
  { label: "Brand Voice", icon: "voice" },
  { label: "Marketing Plan", icon: "growth", group: "GROWTH & MARKET" },
  { label: "Competitor Search", icon: "competitors" },
  { label: "Market Demand", icon: "analytics" },
  { label: "Growth Ideas", icon: "growth" },
  { label: "Content Strategy", icon: "content" },
  { label: "Past Steps", icon: "past", group: "YOUR STRATEGY" },
  { label: "Future Plans", icon: "future" },
  { label: "Website Analytics", icon: "analytics", group: "YOUR WORKSPACE" },
  { label: "Research Sources", icon: "sources" },
  { label: "Search History", icon: "history" },
  { label: "Your Activity", icon: "activity" },
];

export default function WorkspaceSidebar({ active, onSelect }: { active: string; onSelect: (value: string) => void }) {
  const { user } = useAuth();
  return (
    <aside className="min-w-0 border-b border-slate-200/80 bg-white p-3 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0 lg:p-4">
      <div className="mb-4 hidden items-center justify-between px-2 pt-1 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-indigo-700 text-sm font-bold text-white shadow-sm shadow-violet-200">
            O<span className="text-cyan-300">.</span>
          </div>
          <div>
            <p className="text-xs font-bold tracking-tight text-slate-900">Orbit Workspace</p>
            <p className="text-[10px] text-slate-400">Brand Intelligence</p>
          </div>
        </div>
      </div>
      <Link
        href="/analyze"
        onClick={() => onSelect("Brand Overview")}
        className="group mb-3 flex items-center justify-center gap-2 rounded-xl border border-violet-200/80 bg-violet-50/80 px-3.5 py-2.5 text-xs font-semibold text-violet-700 shadow-xs transition hover:bg-violet-100 hover:text-violet-800"
      >
        <Icon name="plus" className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
        New analysis
      </Link>
      <nav aria-label="Workspace sections" className="flex gap-1.5 overflow-x-auto pb-1 lg:block lg:flex-1 lg:overflow-y-auto lg:pb-0">
        {sections.map(item => (
          <div key={item.label}>
            {item.group && (
              <p className="mb-1.5 mt-4 hidden px-2.5 text-[9px] font-bold tracking-[.15em] text-slate-400 lg:block">
                {item.group}
              </p>
            )}
            <button
              onClick={() => onSelect(item.label)}
              aria-current={active === item.label ? "page" : undefined}
              className={`mb-1 flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-left text-xs font-medium transition ${
                active === item.label
                  ? "bg-violet-600 font-semibold text-white shadow-sm shadow-violet-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon name={item.icon} className={`h-4 w-4 ${active === item.label ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">{item.label}</span>
              {active === item.label && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-white lg:block" />}
            </button>
          </div>
        ))}
      </nav>
      <div className="mt-4 hidden rounded-xl border border-slate-100 bg-slate-50/70 p-3 lg:block">
        <p className="text-[11px] font-semibold text-slate-900">{user ? user.name : "Guest Session"}</p>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          {user ? "Research synced to account." : "Sign in to persist research across devices."}
        </p>
        {!user && (
          <Link href="/auth?mode=register" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:underline">
            Upgrade account <span>↗</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
