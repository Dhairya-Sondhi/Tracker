import { getSupabaseAdmin } from "@/lib/supabase/server";
import { indiaDateKey,periodDates } from "@/lib/dates";

export type PlanRange="week"|"month";
export const planDates=(range:PlanRange,anchor=indiaDateKey())=>periodDates(range,anchor);
export async function getPlan(userId:number,range:PlanRange,anchor:string){const dates=planDates(range,anchor);const {data,error}=await getSupabaseAdmin().from("weekly_plan_items").select("tracker_id,planned_date").eq("user_id",userId).gte("planned_date",dates[0]).lte("planned_date",dates.at(-1)!).order("planned_date");if(error)throw error;return (data||[]).map(row=>({trackerId:Number(row.tracker_id),date:String(row.planned_date)}))}
export async function getWeekPlan(userId:number){return getPlan(userId,"week",indiaDateKey())}
export async function savePlan(userId:number,range:PlanRange,anchor:string,items:Array<{trackerId:number;date:string}>){const dates=planDates(range,anchor),allowed=new Set(dates);if(items.some(item=>!allowed.has(item.date)))throw new Error("INVALID_PLAN_DATE");const {error}=await getSupabaseAdmin().rpc("replace_weekly_plan",{p_user_id:userId,p_start:dates[0],p_end:dates.at(-1)!,p_items:items.map(item=>({tracker_id:item.trackerId,planned_date:item.date}))});if(error)throw error}
export async function saveWeekPlan(userId:number,items:Array<{trackerId:number;date:string}>){return savePlan(userId,"week",indiaDateKey(),items)}
