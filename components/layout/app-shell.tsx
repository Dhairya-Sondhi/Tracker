"use client";

import { useEffect,useRef,useState } from "react";
import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import { BarChart3,ChevronRight,LogOut,Settings,ShieldCheck,Sparkles,SunMoon,UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { VlocityMark } from "@/components/brand/vlocity-logo";

const nav=[{label:"Today",href:"/today",icon:Sparkles},{label:"Dashboard",href:"/dashboard",icon:BarChart3}],mobileNav=[...nav,{label:"Settings",href:"/settings",icon:Settings}];
type Account={displayName:string|null;email:string;role:"ADMIN"|"USER"};

export function AppShell({children,accountSource="self"}:{children:React.ReactNode;accountSource?:"self"|"children"}){
 const pathname=usePathname(),router=useRouter(),[account,setAccount]=useState<Account|null>(null),[menu,setMenu]=useState(false),accountResolved=useRef(false);
 useEffect(()=>{const receive=(event:Event)=>{accountResolved.current=true;setAccount((event as CustomEvent<Account>).detail)};window.addEventListener("account:loaded",receive);let cancelled=false;const timer=setTimeout(()=>{if(!accountResolved.current)fetch("/api/auth/me",{cache:"no-store"}).then(response=>response.ok?response.json():null).then(value=>{if(!cancelled&&value){accountResolved.current=true;setAccount(value)}}).catch(()=>{})},accountSource==="children"?10000:0);return()=>{cancelled=true;clearTimeout(timer);window.removeEventListener("account:loaded",receive)}},[accountSource]);
 useEffect(()=>{const close=(event:KeyboardEvent)=>event.key==="Escape"&&setMenu(false);window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[]);
 const name=account?.displayName||account?.email.split("@")[0]||"Account",initials=name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase();
 function cycleTheme(){const current=document.documentElement.dataset.theme==="dark"?"dark":"light",next=current==="dark"?"light":"dark";localStorage.setItem("form-theme",next);document.documentElement.dataset.theme=next}
 async function signOut(){await fetch("/api/auth/signout",{method:"POST"});router.replace("/signin");router.refresh()}

 return <div data-app-theme="workspace" className="min-h-screen w-full overflow-x-clip bg-canvas text-ink selection:bg-violet/40">
  <div className="workspace-ambient pointer-events-none fixed inset-0"/>
  <aside className="fixed inset-y-0 left-0 z-50 hidden w-[88px] flex-col items-center border-r border-line bg-surface/80 py-5 backdrop-blur-2xl lg:flex">
   <Link href="/" aria-label="Vlocity home" className="focus-ring grid size-11 place-items-center rounded-2xl border border-white/10 bg-white text-black shadow-[0_8px_28px_rgba(255,255,255,.1)]"><VlocityMark className="size-7"/></Link>
   <nav className="mt-12 flex w-full flex-col items-center gap-3" aria-label="App navigation">{nav.map(({label,href,icon:Icon})=>{const active=pathname===href||(href==="/dashboard"&&pathname==="/analytics");return <Link key={href} href={href} aria-current={active?"page":undefined} className={cn("focus-ring group flex w-[68px] flex-col items-center gap-1.5 rounded-2xl py-3 text-[9px] font-semibold transition-all",active?"border border-line bg-surface-raised text-ink shadow-soft":"text-muted hover:bg-surface hover:text-ink")}><Icon aria-hidden="true" size={18} className={active?"text-lavender":""}/>{label}</Link>})}</nav>
   <div className="relative mt-auto flex flex-col gap-2">
    <button onClick={cycleTheme} aria-label="Toggle light or dark theme" className="focus-ring grid size-11 place-items-center rounded-xl text-muted hover:bg-surface hover:text-ink"><SunMoon size={17}/></button>
    <Link href="/settings" aria-label="Open settings" className="focus-ring grid size-11 place-items-center rounded-xl text-muted hover:bg-surface hover:text-ink"><Settings size={17}/></Link>
    <button onClick={()=>setMenu(value=>!value)} aria-label="Open account menu" aria-expanded={menu} className="focus-ring grid size-11 place-items-center rounded-full border border-lavender/35 bg-lavender/10 text-xs font-bold text-lavender">{initials}</button>
    {menu&&<div role="dialog" aria-label="Account menu" className="absolute bottom-0 left-14 w-72 overflow-hidden rounded-2xl border border-line bg-surface-raised/98 p-2 shadow-[0_24px_80px_rgba(0,0,0,.55)] backdrop-blur-2xl"><div className="p-3"><p className="truncate text-sm font-semibold">{name}</p><p className="mt-1 truncate text-[10px] text-white/40">{account?.email||"Loading account…"}</p><span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-lavender/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-lavender"><ShieldCheck size={11}/>{account?.role==="ADMIN"?"Administrator":"Member"}</span></div><div className="border-t border-white/[.08] pt-2"><MenuLink href="/settings" icon={UserRound} label="Profile & preferences"/>{account?.role==="ADMIN"&&<MenuLink href="/admin" icon={ShieldCheck} label="Admin control center"/>}<button onClick={signOut} className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs text-negative hover:bg-white/5"><LogOut size={15}/>Sign out</button></div></div>}
   </div>
  </aside>
  <div className="relative min-w-0 max-w-full lg:pl-[88px]">{children}</div>
  <nav className="fixed inset-x-3 bottom-[calc(.75rem+env(safe-area-inset-bottom))] z-50 grid min-w-0 grid-cols-[repeat(3,minmax(0,1fr))] overflow-hidden rounded-[1.35rem] border border-line bg-surface-raised/90 p-1.5 shadow-[0_18px_55px_rgba(0,0,0,.45)] backdrop-blur-2xl lg:hidden" aria-label="Mobile app navigation">
   {mobileNav.map(({label,href,icon:Icon})=>{const active=pathname===href||(href==="/dashboard"&&pathname==="/analytics");return <Link key={href} href={href} aria-current={active?"page":undefined} className={cn("focus-ring flex min-h-13 min-w-0 items-center justify-center gap-1.5 rounded-2xl px-1 text-[10px] font-semibold transition-all",active?"border border-line bg-surface-raised text-ink shadow-soft":"text-muted hover:bg-surface")}><Icon aria-hidden="true" size={16} className="shrink-0"/><span className="hidden min-w-0 truncate min-[360px]:inline">{label}</span></Link>})}
  </nav>
 </div>
}

function MenuLink({href,icon:Icon,label}:{href:string;icon:typeof UserRound;label:string}){return <Link href={href} className="focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs text-white/65 hover:bg-white/5 hover:text-white"><Icon size={15}/><span className="flex-1">{label}</span><ChevronRight size={13}/></Link>}
