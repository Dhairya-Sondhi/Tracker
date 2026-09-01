import { getSupabaseAdmin } from "@/lib/supabase/server";

export type TrackerStatus="complete"|"partial"|"missed"|"skip"|"rest"|"none";
export type TrackerKind="boolean"|"number"|"duration"|"rating";
export type TrackerHistory={date:string;status:TrackerStatus;value:number};
export type UserTracker={id:number;name:string;detail:string;value:number;target:number;unit:string;kind:TrackerKind;status:TrackerStatus;history:TrackerHistory[]};

const starterTemplates=[
 ["Wake before 7","Before 7:00 AM","BOOLEAN",1,"",1],["Morning routine","6 step ritual","BOOLEAN",1,"",2],["Gym","Movement · 45 min","BOOLEAN",1,"",3],["Water","Daily target · 3 L","NUMBER",3,"L",4],["Study","Daily target · 120 min","DURATION",120,"min",5],["Reading","Daily target · 30 pages","NUMBER",30,"pages",6],["Meditation","Daily target · 15 min","DURATION",15,"min",7],["Mood","How today feels","RATING",10,"/10",8],
] as const;
const dbStatusToUi:Record<string,TrackerStatus>={COMPLETE:"complete",PARTIAL:"partial",MISSED:"missed",PLANNED_SKIP:"skip",REST_DAY:"rest",PENDING:"none"};
const uiStatusToDb:Record<TrackerStatus,string>={complete:"COMPLETE",partial:"PARTIAL",missed:"MISSED",skip:"PLANNED_SKIP",rest:"REST_DAY",none:"PENDING"};
const kind=(value:string):TrackerKind=>value==="BOOLEAN"?"boolean":value==="DURATION"||value==="TIME"?"duration":value==="RATING"?"rating":"number";
export const todayInIndia=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const shift=(key:string,days:number)=>{const date=new Date(`${key}T12:00:00+05:30`);date.setUTCDate(date.getUTCDate()+days);return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(date)};

export async function ensureStarterTrackers(userId:number){
 const admin=getSupabaseAdmin();const {count,error}=await admin.from("trackers").select("id",{head:true,count:"exact"}).eq("user_id",userId);if(error)throw error;if((count||0)>0)return;
 const {error:insertError}=await admin.from("trackers").insert(starterTemplates.map(([name,detail,type,target_value,unit,sort_order])=>({user_id:userId,name,detail,type,target_value,unit,sort_order})));if(insertError)throw insertError;
}

type TrackerRow={id:number;name:string;detail:string;type:string;target_value:number|null;unit:string};
type EntryRow={tracker_id:number;entry_date:string;numeric_value:number|null;boolean_value:boolean|null;status:string};
export async function getUserTrackers(userId:number){
 await ensureStarterTrackers(userId);const admin=getSupabaseAdmin(),today=todayInIndia();
 const [{data:trackerRows,error:trackerError},{data:entryRows,error:entryError}]=await Promise.all([
  admin.from("trackers").select("id,name,detail,type,target_value,unit").eq("user_id",userId).eq("is_archived",false).order("sort_order").order("id"),
  admin.from("tracker_entries").select("tracker_id,entry_date,numeric_value,boolean_value,status").eq("user_id",userId).gte("entry_date",shift(today,-90)).order("entry_date"),
 ]);
 if(trackerError)throw trackerError;if(entryError)throw entryError;
 const entries=(entryRows||[]) as EntryRow[];
 return ((trackerRows||[]) as TrackerRow[]).map(row=>{const history=entries.filter(entry=>Number(entry.tracker_id)===Number(row.id)).map(entry=>({date:entry.entry_date,status:dbStatusToUi[entry.status]||"none",value:Number(entry.numeric_value??(entry.boolean_value?1:0))}));const current=history.find(entry=>entry.date===today);return {id:Number(row.id),name:row.name,detail:row.detail,value:current?.value||0,target:Number(row.target_value||1),unit:row.unit,kind:kind(row.type),status:current?.status||"none",history}});
}

export async function createTracker(userId:number,input:{name:string;detail:string;kind:TrackerKind;target:number;unit:string}){
 const admin=getSupabaseAdmin(),type=input.kind==="boolean"?"BOOLEAN":input.kind==="duration"?"DURATION":input.kind==="rating"?"RATING":"NUMBER";
 const {data:last,error:lastError}=await admin.from("trackers").select("sort_order").eq("user_id",userId).order("sort_order",{ascending:false}).limit(1).maybeSingle<{sort_order:number}>();if(lastError)throw lastError;
 const {data,error}=await admin.from("trackers").insert({user_id:userId,name:input.name,detail:input.detail,type,target_value:input.target,unit:input.unit,sort_order:Number(last?.sort_order||0)+1}).select("id").single<{id:number}>();if(error)throw error;
 return {id:Number(data.id),...input,value:0,status:"none" as const,history:[]};
}

export async function saveTrackerEntry(userId:number,trackerId:number,input:{status:TrackerStatus;value:number;date?:string}){
 const admin=getSupabaseAdmin();const {data:owner,error:ownerError}=await admin.from("trackers").select("id").eq("id",trackerId).eq("user_id",userId).eq("is_archived",false).maybeSingle();if(ownerError)throw ownerError;if(!owner)throw new Error("TRACKER_NOT_FOUND");
 const date=input.date||todayInIndia();const {error}=await admin.from("tracker_entries").upsert({tracker_id:trackerId,user_id:userId,entry_date:date,numeric_value:input.value,status:uiStatusToDb[input.status],updated_at:new Date().toISOString()},{onConflict:"tracker_id,entry_date"});if(error)throw error;return {date,...input};
}
