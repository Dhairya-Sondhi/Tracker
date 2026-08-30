import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Pool, PoolConnection } from "mysql2/promise";
import { getDb } from "@/lib/db";

export type TrackerStatus="complete"|"partial"|"missed"|"skip"|"rest"|"none";
export type TrackerKind="boolean"|"number"|"duration"|"rating";
export type TrackerHistory={date:string;status:TrackerStatus;value:number};
export type UserTracker={id:number;name:string;detail:string;value:number;target:number;unit:string;kind:TrackerKind;status:TrackerStatus;history:TrackerHistory[]};

const starterTemplates=[
  ["Wake before 7","Before 7:00 AM","BOOLEAN",1,"",1],
  ["Morning routine","6 step ritual","BOOLEAN",1,"",2],
  ["Gym","Movement · 45 min","BOOLEAN",1,"",3],
  ["Water","Daily target · 3 L","NUMBER",3,"L",4],
  ["Study","Daily target · 120 min","DURATION",120,"min",5],
  ["Reading","Daily target · 30 pages","NUMBER",30,"pages",6],
  ["Meditation","Daily target · 15 min","DURATION",15,"min",7],
  ["Mood","How today feels","RATING",10,"/10",8],
] as const;

const dbStatusToUi:Record<string,TrackerStatus>={COMPLETE:"complete",PARTIAL:"partial",MISSED:"missed",PLANNED_SKIP:"skip",REST_DAY:"rest",PENDING:"none"};
const uiStatusToDb:Record<TrackerStatus,string>={complete:"COMPLETE",partial:"PARTIAL",missed:"MISSED",skip:"PLANNED_SKIP",rest:"REST_DAY",none:"PENDING"};
const kind=(value:string):TrackerKind=>value==="BOOLEAN"?"boolean":value==="DURATION"||value==="TIME"?"duration":value==="RATING"?"rating":"number";
export const todayInIndia=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

export async function ensureStarterTrackers(userId:number,db:Pool|PoolConnection=getDb()){
  const [rows]=await db.query<(RowDataPacket&{count:number})[]>("SELECT COUNT(*) count FROM trackers WHERE user_id=?",[userId]);if(Number(rows[0].count)>0)return;
  const placeholders=starterTemplates.map(()=>"(?,?,?,?,?,?,?)").join(",");const values=starterTemplates.flatMap(([name,detail,type,target,unit,sortOrder])=>[userId,name,detail,type,target,unit,sortOrder]);
  await db.execute(`INSERT INTO trackers (user_id,name,detail,type,target_value,unit,sort_order) VALUES ${placeholders}`,values);
}

interface TrackerRow extends RowDataPacket{id:number;name:string;detail:string;type:string;target_value:string|number|null;unit:string;entry_date:string|null;numeric_value:string|number|null;boolean_value:number|null;status:string|null}
export async function getUserTrackers(userId:number){
  await ensureStarterTrackers(userId);const today=todayInIndia();
  const [rows]=await getDb().query<TrackerRow[]>("SELECT t.id,t.name,t.detail,t.type,t.target_value,t.unit,DATE_FORMAT(e.entry_date,'%Y-%m-%d') entry_date,e.numeric_value,e.boolean_value,e.status FROM trackers t LEFT JOIN tracker_entries e ON e.tracker_id=t.id AND e.entry_date >= DATE_SUB(?,INTERVAL 90 DAY) WHERE t.user_id=? AND t.is_archived=FALSE ORDER BY t.sort_order,t.id,e.entry_date",[today,userId]);
  const trackers=new Map<number,UserTracker>();
  for(const row of rows){let tracker=trackers.get(Number(row.id));if(!tracker){tracker={id:Number(row.id),name:row.name,detail:row.detail,value:0,target:Number(row.target_value||1),unit:row.unit,kind:kind(row.type),status:"none",history:[]};trackers.set(tracker.id,tracker)}if(row.entry_date){const date=row.entry_date;const entry={date,status:dbStatusToUi[row.status||"PENDING"]||"none",value:Number(row.numeric_value??row.boolean_value??0)};tracker.history.push(entry);if(date===today){tracker.value=entry.value;tracker.status=entry.status}}}
  return [...trackers.values()];
}

export async function createTracker(userId:number,input:{name:string;detail:string;kind:TrackerKind;target:number;unit:string}){
  const type=input.kind==="boolean"?"BOOLEAN":input.kind==="duration"?"DURATION":input.kind==="rating"?"RATING":"NUMBER";
  const [orderRows]=await getDb().query<(RowDataPacket&{next_order:number})[]>("SELECT COALESCE(MAX(sort_order),0)+1 next_order FROM trackers WHERE user_id=?",[userId]);
  const [result]=await getDb().execute<ResultSetHeader>("INSERT INTO trackers (user_id,name,detail,type,target_value,unit,sort_order) VALUES (?,?,?,?,?,?,?)",[userId,input.name,input.detail,type,input.target,input.unit,Number(orderRows[0].next_order)]);
  return {id:Number(result.insertId),...input,value:0,status:"none" as const,history:[]};
}

export async function saveTrackerEntry(userId:number,trackerId:number,input:{status:TrackerStatus;value:number;date?:string}){
  const [owner]=await getDb().query<RowDataPacket[]>("SELECT id FROM trackers WHERE id=? AND user_id=? AND is_archived=FALSE LIMIT 1",[trackerId,userId]);if(!owner.length)throw new Error("TRACKER_NOT_FOUND");
  const date=input.date||todayInIndia();await getDb().execute("INSERT INTO tracker_entries (tracker_id,user_id,entry_date,numeric_value,status) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE numeric_value=VALUES(numeric_value),status=VALUES(status),updated_at=CURRENT_TIMESTAMP",[trackerId,userId,date,input.value,uiStatusToDb[input.status]]);
  return {date,...input};
}
