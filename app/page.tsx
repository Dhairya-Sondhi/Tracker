import { SiteHeader } from "@/components/layout/site-header";
import { MarketingPage } from "@/components/marketing/marketing-page";
import Link from "next/link";

export default function Home() {
  return <><SiteHeader /><main><MarketingPage /></main><footer className="border-t border-white/10 bg-[#0c0b11] text-white"><div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between"><div><p className="text-lg font-semibold tracking-[-.04em]">form</p><p className="mt-2 text-xs text-white/45">Make progress personal, visible, and sustainable.</p></div><nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/60"><Link className="hover:text-white" href="/today">Today</Link><Link className="hover:text-white" href="/templates">Templates</Link><Link className="hover:text-white" href="/signin">Sign in</Link><Link className="hover:text-white" href="/signup">Create account</Link></nav><p className="text-[10px] text-white/35">© {new Date().getFullYear()} Form</p></div></footer></>;
}
