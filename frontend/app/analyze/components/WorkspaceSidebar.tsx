import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import Icon from "./WorkspaceIcon";
export const sections = [
  { label: "Brand Overview", icon: "overview", group: "YOUR RESEARCH" },
  { label: "Your Product", icon: "product" }, { label: "Target Audience", icon: "audience" }, { label: "Brand Voice", icon: "voice" },
  { label: "Competitor Search", icon: "competitors" }, { label: "Market Demand", icon: "analytics" },
  // { label: "Past Steps", icon: "past", group: "YOUR STRATEGY" }, { label: "Future Plans", icon: "future" },
  { label: "Marketing Channels to use", icon: "growth" }, { label: "Growth Ideas", icon: "growth" },
  //  { label: "Content Themes", icon: "content" },
  // { label: "Website Analytics", icon: "analytics", group: "YOUR WORKSPACE" }, { label: "Research Sources", icon: "sources" },
  { label: "Search History", icon: "history" }, { label: "Your Activity", icon: "activity" },
];
export default function WorkspaceSidebar({ active, onSelect }: { active: string; onSelect: (value: string) => void }) {
  const { user } = useAuth();
  return <aside className="min-w-0 border-b border-slate-200 bg-white p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0 lg:p-5">
    <div className="mb-5 hidden items-center gap-3 lg:flex"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-violet-700">O<span className="text-cyan-500">.</span></div><div><p className="text-sm font-semibold text-slate-900">Brand workspace</p><p className="mt-1 text-[11px] text-slate-400">A little clarity. A bigger orbit.</p></div></div>
    <Link href="/analyze" onClick={() => onSelect("Brand Overview")} className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-semibold text-violet-700 hover:bg-violet-100"><Icon name="plus" />New analysis</Link>
    <nav aria-label="Workspace sections" className="flex gap-1 overflow-x-auto lg:block lg:flex-1 lg:overflow-y-auto">{sections.map(item => <div key={item.label}>
      {item.group && <p className="mb-2 mt-5 hidden px-3 text-[9px] font-semibold tracking-[.16em] text-slate-400 lg:block">{item.group}</p>}
      <button onClick={() => onSelect(item.label)} aria-current={active === item.label ? "page" : undefined} className={`mb-1 flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-xs transition ${active === item.label ? "bg-violet-600 font-semibold text-white shadow-sm shadow-violet-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon name={item.icon} />{item.label}{active === item.label && <span className="ml-auto hidden h-1 w-1 rounded-full bg-white lg:block" />}</button>
    </div>)}</nav>
    <div className="mt-6 hidden rounded-xl border border-violet-100 bg-linear-to-br from-violet-50 to-white p-4 lg:block"><p className="text-xs font-semibold text-violet-950">{user ? `Your space, ${user.name.split(" ")[0]}.` : "Make your research yours."}</p><p className="mt-2 text-[11px] leading-5 text-slate-500">{user ? "Your research and notes are saved to your account." : "Create an account to keep your guest research and access it across devices."}</p>{!user && <Link href="/auth?mode=register" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-violet-700">Create account <span>↗</span></Link>}</div>
    <p className="mt-4 hidden px-2 text-[9px] text-slate-400 lg:block">PRIVATE WORKSPACE · ORBIT BY VIDORAHUB</p>
  </aside>;
}
