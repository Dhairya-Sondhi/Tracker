"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export const weeklyData = [
  { day:"Mon", consistency:72, completion:68 },{ day:"Tue", consistency:78, completion:74 },{ day:"Wed", consistency:91, completion:94 },{ day:"Thu", consistency:82, completion:78 },{ day:"Fri", consistency:87, completion:85 },{ day:"Sat", consistency:80, completion:72 },{ day:"Sun", consistency:89, completion:88 },
];
export const monthlyData = [
  { week:"W1", value:68 },{ week:"W2", value:72 },{ week:"W3", value:76 },{ week:"W4", value:81 },{ week:"W5", value:87 },
];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value:number;name:string}>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-white/10 bg-[#15131c]/95 px-3 py-2 text-white shadow-xl backdrop-blur-xl"><p className="mb-1 text-[9px] uppercase tracking-widest text-white/45">{label}</p>{payload.map(item=><p key={item.name} className="text-xs font-semibold">{item.value}% <span className="font-normal text-white/45">{item.name}</span></p>)}</div>;
}
const axis = { fill:"currentColor", fontSize:10, fontWeight:600 };
const heatmapDateFormatter = new Intl.DateTimeFormat("en-GB", { day:"numeric", month:"short", year:"numeric", timeZone:"UTC" });

export function WeeklyLineChart({ dark=false }: { dark?:boolean }) {
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={weeklyData} margin={{left:-18,right:8,top:12,bottom:0}}><defs><linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#9C7CFF"/><stop offset="1" stopColor="#F5C5D8"/></linearGradient></defs><CartesianGrid vertical={false} stroke={dark?"rgba(255,255,255,.08)":"rgba(12,12,16,.07)"}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={axis}/><YAxis domain={[50,100]} axisLine={false} tickLine={false} tick={axis}/><Tooltip content={<ChartTooltip/>} cursor={{stroke:"rgba(156,124,255,.3)"}}/><Line type="monotone" dataKey="consistency" stroke="url(#lineGlow)" strokeWidth={3} dot={{r:3,fill:"#7356E8",strokeWidth:0}} activeDot={{r:6,fill:"#9C7CFF",stroke:"rgba(156,124,255,.25)",strokeWidth:7}} animationDuration={1400}/></LineChart></ResponsiveContainer>;
}

export function CompletionBars({ dark=false }: { dark?:boolean }) {
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData} margin={{left:-24,right:4,top:10}}><CartesianGrid vertical={false} stroke={dark?"rgba(255,255,255,.08)":"rgba(12,12,16,.07)"}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={axis}/><YAxis axisLine={false} tickLine={false} tick={axis}/><Tooltip content={<ChartTooltip/>} cursor={{fill:"rgba(115,86,232,.06)"}}/><Bar dataKey="completion" fill="#7356E8" radius={[7,7,2,2]} animationDuration={1200}/></BarChart></ResponsiveContainer>;
}

export function LifeRadar({ dark=false }: { dark?:boolean }) {
  const data=[{area:"Health",value:83},{area:"Career",value:74},{area:"Learning",value:91},{area:"Relationships",value:76},{area:"Finance",value:86},{area:"Wellness",value:69}];
  return <ResponsiveContainer width="100%" height="100%"><RadarChart data={data} outerRadius="72%"><PolarGrid stroke={dark?"rgba(255,255,255,.12)":"rgba(12,12,16,.1)"}/><PolarAngleAxis dataKey="area" tick={{...axis,fill:dark?"#aba6b5":"#686571"}}/><Radar dataKey="value" stroke="#9C7CFF" strokeWidth={2} fill="#7356E8" fillOpacity={.25} animationDuration={1400}/><Tooltip content={<ChartTooltip/>}/></RadarChart></ResponsiveContainer>;
}

export function ActivityHeatmap({ compact=false, dark=false }: {compact?:boolean;dark?:boolean}) {
  const cells=Array.from({length:compact?112:365},(_,i)=>({value:(i*17+i%9*11)%101,date:new Date(Date.UTC(2025,8,1+i)),note:i%37===0?"Strong focus day":undefined}));
  return <div className={cn("grid grid-flow-col gap-[3px] overflow-hidden",compact?"grid-rows-7":"grid-rows-7")} style={{gridTemplateColumns:`repeat(${compact?16:53},minmax(0,1fr))`}}>{cells.map((cell,i)=><span key={i} title={`${heatmapDateFormatter.format(cell.date)} · ${cell.value}% complete${cell.note?` · ${cell.note}`:""}`} className={cn("aspect-square min-w-[4px] rounded-[2px] transition-transform hover:z-10 hover:scale-150",cell.value<25&&(dark?"bg-white/5":"bg-ink/5"),cell.value>=25&&cell.value<50&&"bg-lilac/40",cell.value>=50&&cell.value<75&&"bg-lavender/65",cell.value>=75&&"bg-violet")}/>)}</div>;
}

export function ScoreRing({score=82,label="Life score",size=180}:{score?:number;label?:string;size?:number}) {
  const r=72,c=2*Math.PI*r;
  return <div className="relative grid place-items-center" style={{width:size,height:size}}><svg viewBox="0 0 180 180" className="absolute size-full -rotate-90"><circle cx="90" cy="90" r={r} fill="none" stroke="currentColor" className="text-white/10" strokeWidth="8"/><circle cx="90" cy="90" r={r} fill="none" stroke="#9C7CFF" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-score/100)} className="analytics-ring"/></svg><div className="text-center"><strong className="text-4xl tracking-[-.06em]">{score}</strong><span className="block text-[9px] font-bold uppercase tracking-[.18em] opacity-50">{label}</span></div></div>;
}
