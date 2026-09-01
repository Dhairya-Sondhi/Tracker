import { assertSupabase,getSupabaseAdmin } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth/types";

export type AdminUser={id:number;email:string;displayName:string|null;role:UserRole;isActive:boolean;createdAt:string;updatedAt:string;lastLoginAt:string|null;lastSeenAt:string|null;trackerCount:number;entryCount:number;completedCount:number};
export type AuditEvent={id:number;action:string;createdAt:string;actorName:string|null;targetName:string|null};
export type AdminOverview={stats:{total:number;active:number;admins:number;newToday:number;signedInWeek:number};users:AdminUser[];events:AuditEvent[]};

type UserRow={id:number|string;email:string;display_name:string|null;role:UserRole;is_active:boolean;created_at:string;updated_at:string;last_login_at:string|null;last_seen_at:string|null};
type EntryRow={user_id:number|string;status:string};

function enrichUser(row:UserRow,trackerCounts:Map<number,number>,entryCounts:Map<number,number>,completedCounts:Map<number,number>):AdminUser{
 const id=Number(row.id);
 return {id,email:row.email,displayName:row.display_name,role:row.role,isActive:row.is_active,createdAt:row.created_at,updatedAt:row.updated_at,lastLoginAt:row.last_login_at,lastSeenAt:row.last_seen_at,trackerCount:trackerCounts.get(id)||0,entryCount:entryCounts.get(id)||0,completedCount:completedCounts.get(id)||0};
}

async function loadUsers():Promise<AdminUser[]>{
 const supabase=getSupabaseAdmin();
 const [usersResult,trackersResult,entriesResult]=await Promise.all([
  supabase.from("users").select("id,email,display_name,role,is_active,created_at,updated_at,last_login_at,last_seen_at").order("created_at",{ascending:false}).limit(500),
  supabase.from("trackers").select("user_id").limit(100000),
  supabase.from("tracker_entries").select("user_id,status").limit(100000),
 ]);
 const users=assertSupabase(usersResult) as UserRow[],trackers=assertSupabase(trackersResult) as {user_id:number|string}[],entries=assertSupabase(entriesResult) as EntryRow[];
 const trackerCounts=new Map<number,number>(),entryCounts=new Map<number,number>(),completedCounts=new Map<number,number>();
 for(const row of trackers){const id=Number(row.user_id);trackerCounts.set(id,(trackerCounts.get(id)||0)+1)}
 for(const row of entries){const id=Number(row.user_id);entryCounts.set(id,(entryCounts.get(id)||0)+1);if(row.status==="COMPLETE")completedCounts.set(id,(completedCounts.get(id)||0)+1)}
 return users.map(row=>enrichUser(row,trackerCounts,entryCounts,completedCounts));
}

export async function getAdminOverview():Promise<AdminOverview>{
 const supabase=getSupabaseAdmin();
 const [users,eventsResult]=await Promise.all([loadUsers(),supabase.from("admin_audit_logs").select("id,action,created_at,actor_user_id,target_user_id").order("created_at",{ascending:false}).limit(20)]);
 const rawEvents=assertSupabase(eventsResult) as {id:number|string;action:string;created_at:string;actor_user_id:number|string|null;target_user_id:number|string|null}[];
 const names=new Map(users.map(user=>[user.id,user.displayName||user.email]));
 const today=new Date();today.setUTCHours(0,0,0,0);const weekAgo=Date.now()-7*24*60*60*1000;
 return {stats:{total:users.length,active:users.filter(user=>user.isActive).length,admins:users.filter(user=>user.role==="ADMIN").length,newToday:users.filter(user=>Date.parse(user.createdAt)>=today.getTime()).length,signedInWeek:users.filter(user=>user.lastLoginAt&&Date.parse(user.lastLoginAt)>=weekAgo).length},users,events:rawEvents.map(row=>({id:Number(row.id),action:row.action,createdAt:row.created_at,actorName:row.actor_user_id===null?null:names.get(Number(row.actor_user_id))||null,targetName:row.target_user_id===null?null:names.get(Number(row.target_user_id))||null}))};
}

export async function getAdminUser(userId:number){return (await loadUsers()).find(user=>user.id===userId)||null}

export async function updateManagedUser(input:{actorId:number;targetId:number;role?:UserRole;isActive?:boolean}){
 if(input.actorId===input.targetId)throw new Error("SELF_MANAGEMENT_NOT_ALLOWED");
 if(input.role===undefined&&input.isActive===undefined)throw new Error("NO_CHANGES");
 const {error}=await getSupabaseAdmin().rpc("update_managed_user",{p_actor_id:input.actorId,p_target_id:input.targetId,p_role:input.role??null,p_is_active:input.isActive??null});
 if(error){for(const code of ["SELF_MANAGEMENT_NOT_ALLOWED","USER_NOT_FOUND","LAST_ADMIN"] as const)if(error.message.includes(code))throw new Error(code);throw new Error(`SUPABASE_QUERY_FAILED: ${error.message}`)}
 return getAdminUser(input.targetId);
}

export async function recordAuditEvent(input:{actorId?:number|null;targetId?:number|null;action:string;metadata?:unknown}){
 assertSupabase(await getSupabaseAdmin().from("admin_audit_logs").insert({actor_user_id:input.actorId??null,target_user_id:input.targetId??null,action:input.action,metadata:input.metadata??null}).select("id").single());
}
