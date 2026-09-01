"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VlocityBrand } from "@/components/brand/vlocity-logo";
import { cn } from "@/lib/utils";

const marketingNav = [{label:"Product",href:"#product"},{label:"How it works",href:"#how-it-works"},{label:"Templates",href:"#templates"},{label:"Insights",href:"#insights"}];

export function SiteHeader(){
 const [scrolled,setScrolled]=useState(false); const [open,setOpen]=useState(false);
 useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>20);onScroll();window.addEventListener("scroll",onScroll,{passive:true});return()=>window.removeEventListener("scroll",onScroll)},[]);
 useEffect(()=>{document.body.style.overflow=open?"hidden":"";return()=>{document.body.style.overflow=""}},[open]);
 return <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-5"><div className={cn("mx-auto max-w-[1280px] overflow-hidden rounded-[20px] border border-white/10 bg-[#111017]/78 text-white shadow-[inset_0_1px_rgba(255,255,255,.08),0_18px_60px_rgba(0,0,0,.18)] backdrop-blur-xl transition-all duration-300",scrolled&&"bg-[#0e0d13]/92 shadow-[inset_0_1px_rgba(255,255,255,.1),0_22px_70px_rgba(0,0,0,.32)] backdrop-blur-2xl")}>
  <div className="flex h-16 items-center justify-between px-4 sm:px-5"><Link href="/" aria-label="Vlocity home" className="focus-ring rounded-lg text-[15px]"><VlocityBrand markClassName="size-7 text-white" /></Link>
   <nav className="hidden items-center gap-1 lg:flex" aria-label="Marketing navigation">{marketingNav.map(item=><a key={item.label} href={item.href} className="focus-ring rounded-xl px-3.5 py-2 text-[13px] font-semibold text-white/70 transition-colors hover:bg-white/[.06] hover:text-white">{item.label}</a>)}</nav>
   <div className="hidden items-center gap-2 sm:flex"><Link href="/signin"><Button variant="ghost" size="sm" className="text-white/75 hover:bg-white/[.07] hover:text-white">Sign in</Button></Link><Link href="/signup"><Button size="sm" className="bg-white text-black hover:bg-lilac">Start building</Button></Link></div>
   <button className="focus-ring grid size-11 place-items-center rounded-xl bg-white/[.06] text-white lg:hidden sm:flex" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open?"Close menu":"Open menu"}>{open?<X size={19}/>:<Menu size={19}/>}</button>
  </div><div id="mobile-menu" className={cn("grid transition-[grid-template-rows] duration-300 lg:hidden",open?"grid-rows-[1fr]":"grid-rows-[0fr]")}><div className="overflow-hidden"><nav className="grid gap-1 border-t border-white/10 p-3" aria-label="Mobile marketing navigation">{marketingNav.map(item=><a key={item.label} href={item.href} onClick={()=>setOpen(false)} className="focus-ring rounded-xl px-3 py-3.5 text-[15px] font-semibold text-white/72 hover:bg-white/[.06] hover:text-white">{item.label}</a>)}<div className="mt-2 grid gap-2 border-t border-white/10 pt-3 sm:hidden"><Link href="/signin"><Button variant="ghost" className="w-full border border-white/10 text-white">Sign in</Button></Link><Link href="/signup"><Button className="w-full bg-white text-black">Start building</Button></Link></div></nav></div></div>
 </div></header>;
}
