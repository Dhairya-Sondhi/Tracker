import { getSupabaseAdmin } from "@/lib/supabase/server";
import { indiaDateKey } from "@/lib/dates";

export type AnalyticsPeriod=7|30|90|365;
export type AnalyticsPoint={date:string;label:string;completion:number;completed:number;partial:number;planned:number};
export type AnalyticsSnapshot={generatedAt:string;rangeDays:AnalyticsPeriod;score:number;change:number;consistency:number;currentStreak:number;bestStreak:number;completed:number;adherence:number;restDays:number;trend:AnalyticsPoint[];weekdays:Array<{day:string;completion:number}>;heatmap:Array<{date:string;value:number}>;habits:Array<{id:number;name:string;completion:number;completed:number}>};
type TrackerRow={id:number;name:string};type EntryRow={tracker_id:number;entry_date:string;status:string};type PlanRow={tracker_id:number;planned_date:string};
const keyFormatter=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"});
const labelFormatter=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short"});
const weekdayFormatter=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short"});
const dateAtNoon=(key:string)=>new Date(`${key}T12:00:00+05:30`);
const shiftDate=(key:string,amount:number)=>{const date=dateAtNoon(key);date.setUTCDate(date.getUTCDate()+amount);return keyFormatter.format(date)};
const datesEndingToday=(days:number)=>{const today=indiaDateKey();return Array.from({length:days},(_,index)=>shiftDate(today,index-days+1))};
const weight=(status:string)=>status==="COMPLETE"?1:status==="PARTIAL"?.5:0;

export async function getUserAnalytics(userId:number,rangeDays:AnalyticsPeriod):Promise<AnalyticsSnapshot>{
 const admin=getSupabaseAdmin(),today=indiaDateKey(),queryStart=shiftDate(today,-Math.max(729,rangeDays*2-1));
 const [trackerResult,entryResult,planResult]=await Promise.all([
  admin.from("trackers").select("id,name").eq("user_id",userId).eq("is_archived",false).order("sort_order").order("id"),
  admin.from("tracker_entries").select("tracker_id,entry_date,status").eq("user_id",userId).gte("entry_date",queryStart).lte("entry_date",today),
  admin.from("weekly_plan_items").select("tracker_id,planned_date").eq("user_id",userId).gte("planned_date",shiftDate(today,-rangeDays+1)).lte("planned_date",today),
 ]);
 if(trackerResult.error)throw trackerResult.error;if(entryResult.error)throw entryResult.error;if(planResult.error)throw planResult.error;
 const trackers=(trackerResult.data||[]) as TrackerRow[],entries=(entryResult.data||[]) as EntryRow[],plans=(planResult.data||[]) as PlanRow[],trackerCount=trackers.length;
 const byDate=new Map<string,EntryRow[]>();for(const entry of entries){const list=byDate.get(entry.entry_date)||[];list.push(entry);byDate.set(entry.entry_date,list)}
 const completionFor=(date:string)=>trackerCount?Math.round((byDate.get(date)||[]).reduce((sum,entry)=>sum+weight(entry.status),0)/trackerCount*100):0;
 const currentDates=datesEndingToday(rangeDays),priorDates=Array.from({length:rangeDays},(_,index)=>shiftDate(currentDates[0],index-rangeDays));
 const trend=currentDates.map(date=>{const dayEntries=byDate.get(date)||[];return {date,label:labelFormatter.format(dateAtNoon(date)),completion:completionFor(date),completed:dayEntries.filter(entry=>entry.status==="COMPLETE").length,partial:dayEntries.filter(entry=>entry.status==="PARTIAL").length,planned:trackerCount}});
 const score=Math.round(trend.reduce((sum,point)=>sum+point.completion,0)/Math.max(1,trend.length)),priorScore=Math.round(priorDates.reduce((sum,date)=>sum+completionFor(date),0)/Math.max(1,priorDates.length));
 const activeDays=trend.filter(point=>point.completed+point.partial>0).length,completed=trend.reduce((sum,point)=>sum+point.completed,0),restDays=trend.length-activeDays;
 const completeDates=new Set(entries.filter(entry=>entry.status==="COMPLETE").map(entry=>entry.entry_date));let currentStreak=0,cursor=today;if(!completeDates.has(cursor))cursor=shiftDate(cursor,-1);while(completeDates.has(cursor)){currentStreak++;cursor=shiftDate(cursor,-1)}
 let bestStreak=0,running=0;for(const date of datesEndingToday(365)){if(completeDates.has(date)){running++;bestStreak=Math.max(bestStreak,running)}else running=0}
 const plannedComplete=plans.filter(plan=>entries.some(entry=>Number(entry.tracker_id)===Number(plan.tracker_id)&&entry.entry_date===plan.planned_date&&entry.status==="COMPLETE")).length;
 const weekdays=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=>{const matching=trend.filter(point=>weekdayFormatter.format(dateAtNoon(point.date))===day);return {day,completion:Math.round(matching.reduce((sum,point)=>sum+point.completion,0)/Math.max(1,matching.length))}});
 const rangeSet=new Set(currentDates),habits=trackers.map(tracker=>{const relevant=entries.filter(entry=>Number(entry.tracker_id)===Number(tracker.id)&&rangeSet.has(entry.entry_date)),complete=relevant.filter(entry=>entry.status==="COMPLETE").length,weighted=relevant.reduce((sum,entry)=>sum+weight(entry.status),0);return {id:Number(tracker.id),name:tracker.name,completion:Math.round(weighted/Math.max(1,rangeDays)*100),completed:complete}}).sort((a,b)=>b.completion-a.completion);
 return {generatedAt:new Date().toISOString(),rangeDays,score,change:score-priorScore,consistency:Math.round(activeDays/Math.max(1,rangeDays)*100),currentStreak,bestStreak,completed,adherence:plans.length?Math.round(plannedComplete/plans.length*100):score,restDays,trend,weekdays,heatmap:datesEndingToday(365).map(date=>({date,value:completionFor(date)})),habits};
}
