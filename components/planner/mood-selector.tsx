"use client";
import { cn } from "@/lib/utils";

export const moodScale=[
 {range:[1,2],label:"Very low",color:"#A86476"},{range:[3,4],label:"Low",color:"#C47A75"},{range:[5,6],label:"Steady",color:"#C6A36A"},{range:[7,8],label:"Good",color:"#8877DB"},{range:[9,10],label:"Excellent",color:"#77B69A"},
] as const;
export function moodMeta(value:number){return moodScale.find(x=>value>=x.range[0]&&value<=x.range[1])??moodScale[2]}

export function MoodSelector({value,onChange}:{value:number;onChange:(value:number)=>void}){
 const meta=moodMeta(value);
 return <div aria-label="Mood rating"><div className="mb-4 flex items-end justify-between"><div><span className="text-xs font-semibold text-white/70">{value} / 10</span><p className="mt-1 text-sm font-semibold" style={{color:meta.color}}>{meta.label}</p></div><div className="flex gap-3 text-[11px] font-semibold uppercase tracking-wider text-white/50"><span>Low</span><span>Great</span></div></div><div className="relative grid grid-cols-10 gap-1.5 before:absolute before:left-[5%] before:right-[5%] before:top-1/2 before:h-px before:bg-white/10">{Array.from({length:10},(_,i)=>{const n=i+1,m=moodMeta(n),selected=n===value;return <button key={n} type="button" aria-label={`${n} out of 10, ${m.label}`} aria-pressed={selected} onClick={()=>onChange(n)} className="focus-ring relative z-10 grid min-h-11 place-items-center rounded-xl"><span className={cn("grid size-7 place-items-center rounded-full text-[11px] font-bold text-white transition-all duration-200",selected&&"scale-125 ring-4 ring-white/10")} style={{backgroundColor:m.color,boxShadow:selected?`0 0 22px ${m.color}70`:"none"}}>{n}</span></button>})}</div></div>
}
