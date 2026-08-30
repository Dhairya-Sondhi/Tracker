import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { indiaDateKey, periodDates } from "@/lib/dates";

export type PlanRange="week"|"month";
export const planDates=(range:PlanRange,anchor=indiaDateKey())=>periodDates(range,anchor);
export async function getPlan(userId:number,range:PlanRange,anchor:string){const dates=planDates(range,anchor);const [rows]=await getDb().query<(RowDataPacket&{tracker_id:number;planned_date:string})[]>("SELECT tracker_id,DATE_FORMAT(planned_date,'%Y-%m-%d') planned_date FROM weekly_plan_items WHERE user_id=? AND planned_date BETWEEN ? AND ?",[userId,dates[0],dates.at(-1)!]);return rows.map(row=>({trackerId:Number(row.tracker_id),date:row.planned_date}))}
export async function getWeekPlan(userId:number){return getPlan(userId,"week",indiaDateKey())}
export async function savePlan(userId:number,range:PlanRange,anchor:string,items:Array<{trackerId:number;date:string}>){const dates=planDates(range,anchor),allowedDates=new Set(dates);if(items.some(item=>!allowedDates.has(item.date)))throw new Error("INVALID_PLAN_DATE");const ids=[...new Set(items.map(item=>item.trackerId))];if(ids.length){const placeholders=ids.map(()=>"?").join(",");const [owned]=await getDb().query<RowDataPacket[]>(`SELECT id FROM trackers WHERE user_id=? AND is_archived=FALSE AND id IN (${placeholders})`,[userId,...ids]);if(owned.length!==ids.length)throw new Error("INVALID_TRACKER")}
 const connection=await getDb().getConnection();try{await connection.beginTransaction();await connection.execute("DELETE FROM weekly_plan_items WHERE user_id=? AND planned_date BETWEEN ? AND ?",[userId,dates[0],dates.at(-1)!]);if(items.length){const placeholders=items.map(()=>"(?,?,?)").join(",");await connection.execute(`INSERT INTO weekly_plan_items (user_id,tracker_id,planned_date) VALUES ${placeholders}`,items.flatMap(item=>[userId,item.trackerId,item.date]))}await connection.commit()}catch(error){await connection.rollback();throw error}finally{connection.release()}}
export async function saveWeekPlan(userId:number,items:Array<{trackerId:number;date:string}>){return savePlan(userId,"week",indiaDateKey(),items)}
