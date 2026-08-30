"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowRight, BookOpen, Check, Clock3, Droplets, Flame, Footprints, Heart, Moon, Sparkles, TimerReset, TrendingUp, WalletCards } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IntelligenceSections } from "@/components/marketing/intelligence-sections";
import { ActivityHeatmap } from "@/components/charts/analytics-charts";
import { InteractiveBuilder } from "@/components/marketing/interactive-builder";

gsap.registerPlugin(ScrollTrigger);

const chartData = [42, 56, 49, 72, 66, 83, 87].map((value, index) => ({ day: index, value }));
const heat = [1,2,0,3,2,3,1,2,3,3,2,1,3,2,3,0,2,3,3,1,2,3,2,3,1,3,3,2];

function MiniChart({ className }: { className?: string }) {
  return <div className={cn("h-20 w-full", className)}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="miniFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7356E8" stopOpacity={0.38}/><stop offset="1" stopColor="#7356E8" stopOpacity={0}/></linearGradient></defs><Area className="chart-line" type="monotone" dataKey="value" stroke="#7356E8" strokeWidth={2.5} fill="url(#miniFill)" isAnimationActive /></AreaChart></ResponsiveContainer></div>;
}

function Heatmap({ compact = false }: { compact?: boolean }) {
  return <div className={cn("grid grid-cols-7 gap-1", compact ? "w-32" : "w-40")}>{heat.map((level, i) => <span key={i} className={cn("aspect-square rounded-[3px]", level === 0 && "bg-ink/5 dark:bg-white/5", level === 1 && "bg-lilac/50", level === 2 && "bg-lavender/65", level === 3 && "bg-violet")} />)}</div>;
}

function Ring({ value = 82, size = "lg" }: { value?: number; size?: "sm" | "lg" }) {
  const radius = size === "lg" ? 50 : 30;
  const stroke = size === "lg" ? 8 : 6;
  const box = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  return <div className="relative grid shrink-0 place-items-center"><svg width={box} height={box} className="-rotate-90"><circle cx={box/2} cy={box/2} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke}/><circle className="progress-ring" cx={box/2} cy={box/2} r={radius} fill="none" stroke="#7356E8" strokeLinecap="round" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value/100)}/></svg><div className="absolute text-center"><strong className={size === "lg" ? "text-3xl tracking-[-0.05em]" : "text-base"}>{value}</strong>{size === "lg" && <span className="block text-[9px] font-bold uppercase tracking-widest text-muted">Life score</span>}</div></div>;
}

function HeroDashboard() {
  return <div className="hero-dashboard relative mx-auto h-[480px] w-full max-w-[1020px] sm:h-[560px] lg:h-[620px]" aria-label="Personal dashboard preview">
    <div className="ambient absolute inset-x-[12%] top-[12%] h-[70%] rounded-full bg-lilac/30 blur-[100px] dark:bg-violet/10" />
    <Card className="dash-card absolute left-1/2 top-14 z-10 w-[88%] -translate-x-1/2 overflow-hidden bg-surface/90 p-4 shadow-[0_40px_100px_rgba(42,35,71,.15)] sm:top-12 sm:w-[72%] sm:p-6 lg:w-[60%]">
      <div className="mb-6 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">Monday, 24 August</p><h3 className="mt-1 text-xl font-semibold tracking-[-.04em] sm:text-2xl">Your day, in focus.</h3></div><div className="grid size-9 place-items-center rounded-xl bg-violet text-white"><Sparkles size={15}/></div></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[['Sleep','7h 42m',Moon],['Deep Work','2h 18m',TimerReset],['Mood','8.2',Heart]].map(([label,value,Icon]) => { const Glyph = Icon as typeof Moon; return <div key={label as string} className="rounded-xl border border-line bg-canvas/55 p-3"><Glyph size={14} className="mb-4 text-violet"/><p className="text-[10px] text-muted">{label as string}</p><p className="text-sm font-bold">{value as string}</p></div>; })}
      </div>
      <div className="mt-3 rounded-2xl border border-line bg-canvas/45 p-3 sm:p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold">Weekly rhythm</p><p className="text-[10px] text-muted">Moving gently upward</p></div><Badge className="border-0 bg-lilac/30 text-ink dark:text-ink">+12%</Badge></div><MiniChart className="mt-2"/></div>
    </Card>
    <Card className="dash-card float-a absolute left-[1%] top-[18%] z-20 hidden w-48 p-4 sm:block lg:left-[5%]"><div className="flex items-center gap-3"><Ring value={82} size="sm"/><div><p className="text-[10px] text-muted">Life Score</p><p className="text-2xl font-semibold tracking-[-.05em]">82</p></div></div></Card>
    <Card className="dash-card float-b absolute right-[1%] top-[12%] z-20 w-40 p-4 sm:right-[3%] sm:w-48"><div className="mb-5 flex items-center justify-between"><Flame size={17} className="text-violet"/><span className="text-[10px] text-muted">Current streak</span></div><p className="text-2xl font-semibold tracking-[-.05em]">14 days</p><p className="mt-1 text-[10px] text-muted">Your longest this season</p></Card>
    <Card className="dash-card float-c absolute bottom-[8%] left-[2%] z-20 w-44 p-4 sm:bottom-[12%] sm:left-[5%] sm:w-56"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-semibold">Habit rhythm</p><span className="text-[10px] text-muted">4 weeks</span></div><Heatmap compact/></Card>
    <Card className="dash-card float-a absolute bottom-[4%] right-[2%] z-20 w-44 p-4 sm:bottom-[10%] sm:right-[4%] sm:w-56"><div className="flex items-center justify-between"><div><p className="text-[10px] text-muted">Weekly consistency</p><p className="mt-1 text-2xl font-semibold tracking-[-.05em]">87%</p></div><TrendingUp className="text-violet" size={19}/></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full w-[87%] rounded-full bg-violet"/></div></Card>
    <Card className="dash-card float-b absolute bottom-[25%] left-[18%] z-30 hidden px-3 py-2.5 sm:flex items-center gap-2"><span className="grid size-6 place-items-center rounded-lg bg-peach/50 text-ink"><BookOpen size={12}/></span><div><p className="text-[9px] text-muted">Reading</p><p className="text-xs font-bold">24 min</p></div></Card>
    <Card className="dash-card float-c absolute bottom-[30%] right-[14%] z-30 hidden px-3 py-2.5 sm:flex items-center gap-2"><span className="grid size-6 place-items-center rounded-lg bg-lilac/60 text-ink"><Check size={12}/></span><div><p className="text-[9px] text-muted">Exercise</p><p className="text-xs font-bold">Completed</p></div></Card>
  </div>;
}

function SpreadsheetProblem() {
  const rows = ['Wake before 7','Morning pages','Deep work','Read 20 min','Exercise','No screens after 10'];
  const [active,setActive]=useState<'sheet'|'dashboard'>('dashboard');
  return <section id="product" className="problem-section py-24 md:py-36">
    <div className="mx-auto mb-14 max-w-3xl text-center"><p className="eyebrow mb-4 text-violet">From tracking to understanding</p><h2 className="display-md">Your growth deserves better than a spreadsheet.</h2><p className="body-lg mx-auto mt-6 max-w-2xl text-muted">Move between both previews to feel the difference. The panel you choose comes into focus while the other steps back.</p></div>
    <div className="relative grid items-center gap-6 lg:grid-cols-2" onPointerLeave={()=>setActive('dashboard')}>
      <div role="button" tabIndex={0} aria-pressed={active==='sheet'} onPointerEnter={()=>setActive('sheet')} onFocus={()=>setActive('sheet')} onClick={()=>setActive('sheet')} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setActive('sheet')}}} className={cn("spreadsheet-panel focus-ring overflow-hidden rounded-card border border-line bg-[#f3f5f2] shadow-soft transition-[transform,opacity,filter,box-shadow] duration-300 dark:bg-[#17191a]",active==='sheet'?"relative z-20 scale-[1.025] opacity-100 shadow-[0_32px_90px_rgba(38,30,71,.2)]":"z-0 scale-[.965] opacity-45 blur-[1px]")}>
        <div className="flex h-11 items-center gap-2 border-b border-black/10 px-4 dark:border-white/10"><span className="size-2.5 rounded-full bg-[#ff6b64]"/><span className="size-2.5 rounded-full bg-[#ffc45c]"/><span className="size-2.5 rounded-full bg-[#68ca68]"/><span className="ml-3 text-[10px] text-muted">habit_tracker_final_v7.xlsx</span></div>
        <div className="grid grid-cols-[30px_1fr_repeat(5,36px)_58px] text-[9px]"><div className="border-b border-r p-2">#</div><div className="border-b border-r p-2 font-bold">HABIT</div>{['M','T','W','T','F'].map((d,i)=><div key={i} className="border-b border-r p-2 text-center font-bold">{d}</div>)}<div className="border-b p-2 font-bold">RATE</div>{rows.map((row,r)=><div className="contents" key={row}><div className="border-b border-r p-2 text-muted">{r+2}</div><div className="border-b border-r p-2 font-medium">{row}</div>{[0,1,2,3,4].map((d)=><div key={d} className="border-b border-r p-2 text-center">{(r+d)%4!==0?'✓':'□'}</div>)}<div className="border-b p-2 text-center font-mono">={Math.max(40,92-r*7)}%</div></div>)}</div>
        <div className="grid grid-cols-2 gap-3 p-4"><div className="border bg-white/60 p-3 dark:bg-white/5"><p className="text-[9px] font-bold">WEEKLY TOTALS</p><div className="mt-4 flex h-16 items-end gap-1">{[34,56,43,70,62,78,68].map((h,i)=><span key={i} className="flex-1 bg-[#82b98a]" style={{height:`${h}%`}}/>)}</div></div><div className="space-y-2 border bg-white/60 p-3 text-[9px] dark:bg-white/5"><b>FORMULAS</b><p className="font-mono text-muted">=COUNTIF(C2:G2,TRUE)/5</p><p className="font-mono text-[#d55353]">#REF! C14 missing</p><p className="font-mono text-muted">=AVERAGE(H2:H8)</p></div></div>
      </div>
      <Card role="button" tabIndex={0} aria-pressed={active==='dashboard'} onPointerEnter={()=>setActive('dashboard')} onFocus={()=>setActive('dashboard')} onClick={()=>setActive('dashboard')} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setActive('dashboard')}}} className={cn("dashboard-panel focus-ring relative overflow-hidden p-5 transition-[transform,opacity,filter,box-shadow] duration-300 sm:p-7",active==='dashboard'?"z-20 scale-[1.025] opacity-100 shadow-[0_32px_90px_rgba(38,30,71,.2)]":"z-0 scale-[.965] opacity-45 blur-[1px]")}><div className="mb-6 flex items-center justify-between"><div><p className="text-xs text-muted">This week</p><h3 className="heading-md mt-1">Clear at a glance.</h3></div><Ring value={82} size="sm"/></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-lilac/25 p-4"><Moon size={16}/><p className="mt-7 text-[10px] text-muted">Average sleep</p><strong className="text-xl">7h 38m</strong></div><div className="rounded-2xl bg-peach/25 p-4"><Flame size={16}/><p className="mt-7 text-[10px] text-muted">Best rhythm</p><strong className="text-xl">14 days</strong></div></div><div className="mt-3 rounded-2xl border border-line p-4"><div className="flex justify-between text-xs font-semibold"><span>Consistency</span><span>87%</span></div><MiniChart/></div><div className="mt-3 flex items-center justify-between rounded-2xl border border-line p-4"><div><p className="text-xs font-semibold">Daily practices</p><p className="text-[10px] text-muted">21 of 28 completed</p></div><Heatmap compact/></div></Card>
    </div>
  </section>;
}

function BuilderSection(){return <section id="templates" className="py-24 md:py-36"><div className="mb-14 max-w-2xl"><p className="eyebrow mb-4 text-violet">A studio for your life</p><h2 className="display-md">Build it your way.</h2><p className="body-lg mt-5 text-muted">Try the canvas below: add a widget, select it, then edit its content and accent. <strong className="text-ink">No code. No formulas.</strong></p></div><InteractiveBuilder/></section>}

const trackerExamples = [
 {Icon:Check,label:"Gym",value:"Completed",kind:"Boolean",color:"bg-positive/12",visual:<span className="grid size-8 place-items-center rounded-full bg-positive text-white"><Check size={15}/></span>},
 {Icon:Moon,label:"Sleep",value:"7h 42m",kind:"Duration · 8h target",color:"bg-blue-violet/10",visual:<div className="h-1.5 w-full rounded-full bg-line"><div className="h-full w-[96%] rounded-full bg-blue-violet"/></div>},
 {Icon:Droplets,label:"Water",value:"2.8 / 3 L",kind:"Quantity",color:"bg-blue-violet/10",visual:<div className="h-8 overflow-hidden rounded-lg border border-blue-violet/20"><div className="h-full w-[93%] bg-blue-violet/20"/></div>},
 {Icon:Clock3,label:"Study",value:"124 min",kind:"Timer",color:"bg-warning/10",visual:<div className="flex gap-1">{[1,1,1,.55].map((x,i)=><span key={i} className="h-1.5 flex-1 rounded-full bg-warning" style={{opacity:x}}/>)}</div>},
 {Icon:Heart,label:"Mood",value:"8 / 10 · Good",kind:"Rating",color:"bg-[#8877db]/10",visual:<div className="flex items-end gap-1">{["#a86476","#c47a75","#c6a36a","#8877db","#77b69a"].map((c,i)=><span key={c} className="size-2.5 rounded-full" style={{background:c,transform:i===3?"scale(1.35)":"none"}}/>)}</div>},
 {Icon:Footprints,label:"Steps",value:"9,842",kind:"Count · 10k goal",color:"bg-lilac/20",visual:<div className="size-8 rounded-full border-[3px] border-lavender border-r-line"/>},
 {Icon:BookOpen,label:"Reading",value:"32 pages",kind:"Progress",color:"bg-peach/15",visual:<div className="flex gap-1">{[0,1,2,3,4].map(i=><span key={i} className={cn("h-5 flex-1 rounded-sm",i<4?"bg-[#d49372]/55":"bg-line")}/>)}</div>},
 {Icon:WalletCards,label:"Savings",value:"₹4,200",kind:"₹5,000 monthly goal",color:"bg-positive/10",visual:<div className="h-1.5 w-full rounded-full bg-line"><div className="h-full w-[84%] rounded-full bg-positive"/></div>},
] as const;

function TrackerTypes(){return <section id="insights" className="overflow-hidden py-24 md:py-36"><div className="mx-auto mb-16 max-w-2xl text-center"><p className="eyebrow mb-4 text-violet">One system, many signals</p><h2 className="display-md">Life isn’t binary.</h2><p className="body-lg mt-5 text-muted">Different parts of life need different kinds of tracking. Form meets each one in its natural language.</p></div><div className="metric-cloud mx-auto grid max-w-5xl grid-cols-1 gap-3 min-[430px]:grid-cols-2 lg:grid-cols-4">{trackerExamples.map(({Icon,label,value,kind,color},i)=>{const item=trackerExamples[i];return <article key={label} className={cn("metric-piece flex min-h-48 flex-col rounded-[1.4rem] border border-line p-5 shadow-soft",color)}><div className="flex items-center justify-between"><Icon size={18}/><span className="text-xs font-semibold text-muted">{kind}</span></div><div className="mt-auto py-5">{item.visual}</div><p className="text-sm font-semibold text-muted">{label}</p><p className="mt-1 text-xl font-semibold tracking-[-.04em]">{value}</p></article>})}</div></section>}

function DailyCapture() {
  return <section id="creators" className="py-24 md:py-36"><div className="grid items-center gap-14 lg:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow mb-4 text-violet">Daily capture</p><h2 className="display-md">Log your day in seconds.</h2><p className="body-lg mt-6 text-muted">Your dashboard is for seeing the whole picture. Capture is for the moment itself—quick, focused, and always within reach.</p><p className="mt-6 text-sm font-bold">Capture should be fast. Reflection can be deep.</p><Link href="/today"><Button size="lg" className="mt-8">Try today’s log <ArrowRight size={16}/></Button></Link></div><div className="relative min-h-[560px]"><div className="absolute inset-10 rounded-full bg-blush/25 blur-[80px] dark:bg-violet/10"/><Card className="relative mx-auto max-w-xl overflow-hidden p-4 sm:p-6"><div className="mb-6 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-muted">Today · Monday</p><h3 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Good morning, Alex.</h3></div><Ring value={76} size="sm"/></div><div className="space-y-2">{[['Wake before 7','Complete','check'],['Water','2.4 / 3 L','bar'],['Study','95 / 120 min','bar'],['Mood','8 / 10','dots'],['Meditation','12 min','time']].map(([label,value,type])=><div key={label} className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-canvas/50 px-3"><button className={cn("grid size-8 place-items-center rounded-lg",type==='check'?'bg-ink text-canvas':'bg-surface-raised')}><Check size={14}/></button><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{label}</p>{type==='bar'&&<div className="mt-1 h-1 w-full rounded-full bg-line"><div className="h-full w-3/4 rounded-full bg-violet"/></div>}</div><span className="text-xs font-semibold text-muted">{value}</span></div>)}</div></Card><Card className="absolute -bottom-6 right-0 w-48 p-4 sm:-right-5"><p className="text-[10px] text-muted">Today’s progress</p><p className="mt-1 text-2xl font-semibold">76%</p><div className="mt-3 h-1.5 rounded-full bg-line"><div className="h-full w-3/4 rounded-full bg-violet"/></div></Card></div></div></section>;
}

export function MarketingPage() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    gsap.timeline().from(".hero-kicker",{y:12,opacity:0,duration:.65}).from(".hero-title .line",{y:70,opacity:0,duration:1.1,stagger:.1,ease:"power4.out"},"-=.35").from(".hero-copy",{y:20,opacity:0,duration:.7},"-=.6").from(".hero-cta",{y:16,opacity:0,duration:.7,stagger:.08},"-=.45").from(".dash-card",{y:45,scale:.96,opacity:0,duration:1,stagger:.09,ease:"power3.out"},"-=.4");
    gsap.to(".ambient",{x:35,y:-20,duration:8,repeat:-1,yoyo:true,ease:"sine.inOut"});
    gsap.to(".float-a",{y:-8,duration:4,repeat:-1,yoyo:true,ease:"sine.inOut"}); gsap.to(".float-b",{y:9,duration:5,repeat:-1,yoyo:true,ease:"sine.inOut"}); gsap.to(".float-c",{y:-6,duration:4.5,repeat:-1,yoyo:true,ease:"sine.inOut"});
    gsap.from(".progress-ring",{strokeDashoffset:400,duration:1.6,ease:"power2.out",delay:.8});
    gsap.utils.toArray<HTMLElement>("section:not(.hero-section)").forEach(section=>gsap.from(section.querySelectorAll(".eyebrow, h2, .body-lg"),{scrollTrigger:{trigger:section,start:"top 76%"},y:28,opacity:0,duration:.8,stagger:.1,ease:"power3.out"}));
    gsap.from(".builder-ui",{scrollTrigger:{trigger:".builder-ui",start:"top 80%"},y:45,opacity:0,duration:1,ease:"power3.out"});
    gsap.from(".metric-piece",{scrollTrigger:{trigger:".metric-cloud",start:"top 75%"},y:35,opacity:0,scale:.96,duration:.75,stagger:.07,ease:"power3.out"});
    const hero = root.current?.querySelector<HTMLElement>(".hero-dashboard");
    const onMove=(event:MouseEvent)=>{if(!hero||window.innerWidth<900)return;const r=hero.getBoundingClientRect();const x=(event.clientX-r.left)/r.width-.5;const y=(event.clientY-r.top)/r.height-.5;gsap.to(hero.querySelectorAll(".dash-card"),{x:x*10,y:y*8,duration:1.2,ease:"power2.out",overwrite:"auto"});};
    hero?.addEventListener("mousemove",onMove); return ()=>hero?.removeEventListener("mousemove",onMove);
  },{scope:root});

  return <div ref={root}>
    <section className="hero-section relative overflow-hidden pb-12 pt-36 sm:pt-44"><div className="pointer-events-none absolute -left-40 top-0 size-[34rem] rounded-full bg-lilac/35 blur-[110px] dark:bg-violet/10"/><div className="pointer-events-none absolute -right-40 top-52 size-[30rem] rounded-full bg-peach/30 blur-[120px] dark:bg-blush/5"/><Container><div className="relative mx-auto max-w-4xl text-center"><Badge className="hero-kicker mb-7"><Sparkles size={11}/> Your life, made visible</Badge><h1 className="hero-title display-xl"><span className="line block">Build the dashboard</span><span className="line block">for the person you’re becoming.</span></h1><p className="hero-copy body-lg mx-auto mt-7 max-w-2xl text-muted">Track the habits, goals and numbers that matter to you. Turn everyday actions into a personal dashboard that shows where you’re growing — and where you’re getting stuck.</p><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><Link href="/today" className="hero-cta"><Button size="lg">Build My Dashboard <ArrowRight size={16}/></Button></Link><a href="#templates" className="hero-cta"><Button size="lg" variant="secondary">Explore Templates</Button></a></div></div><HeroDashboard/></Container></section>
    <Container><SpreadsheetProblem/><div id="how-it-works"><BuilderSection/></div><TrackerTypes/><DailyCapture/><IntelligenceSections/></Container>
    <section id="pricing" className="relative overflow-hidden border-t border-white/10 bg-[#0c0b11] py-28 text-white md:py-36"><div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-[.12]"><ActivityHeatmap dark/></div><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(115,86,232,.24),transparent_45%),linear-gradient(to_bottom,#0c0b11_10%,rgba(12,11,17,.92),#0c0b11)]"/><Container className="relative text-center"><p className="eyebrow mb-5 text-lavender">The best time is still now</p><h2 className="display-md mx-auto max-w-4xl text-white">A year from now, you’ll wish you started today.</h2><p className="body-lg mt-6 text-white/65">Build a calm system that grows with you.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/onboarding"><Button className="bg-white text-black hover:bg-white/90" size="lg">Build My Dashboard <ArrowRight size={16}/></Button></Link><Link href="/templates"><Button className="border border-white/15 text-white hover:bg-white/10" variant="ghost" size="lg">Explore Templates</Button></Link></div></Container></section>
  </div>;
}
