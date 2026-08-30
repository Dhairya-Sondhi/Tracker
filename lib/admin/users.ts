import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import type { UserRole } from "@/lib/auth/types";

export type AdminUser = {
  id:number; email:string; displayName:string|null; role:UserRole; isActive:boolean;
  createdAt:string; updatedAt:string; lastLoginAt:string|null; lastSeenAt:string|null;
  trackerCount:number; entryCount:number; completedCount:number;
};

export type AuditEvent = {
  id:number; action:string; createdAt:string; actorName:string|null; targetName:string|null;
};

export type AdminOverview = {
  stats:{total:number;active:number;admins:number;newToday:number;signedInWeek:number};
  users:AdminUser[];
  events:AuditEvent[];
};

interface AdminUserRow extends RowDataPacket {
  id:number; email:string; display_name:string|null; role:UserRole; is_active:number;
  created_at:Date; updated_at:Date; last_login_at:Date|null; last_seen_at:Date|null;
  tracker_count:number; entry_count:number; completed_count:number;
}

const iso=(date:Date|null)=>date?date.toISOString():null;
const mapUser=(row:AdminUserRow):AdminUser=>({
  id:Number(row.id),email:row.email,displayName:row.display_name,role:row.role,isActive:Boolean(row.is_active),
  createdAt:row.created_at.toISOString(),updatedAt:row.updated_at.toISOString(),lastLoginAt:iso(row.last_login_at),lastSeenAt:iso(row.last_seen_at),
  trackerCount:Number(row.tracker_count),entryCount:Number(row.entry_count),completedCount:Number(row.completed_count),
});

export async function getAdminOverview():Promise<AdminOverview>{
  const db=getDb();
  const [statsResult,usersResult,eventsResult]=await Promise.all([
    db.query<(RowDataPacket&{total:number;active:number;admins:number;new_today:number;signed_in_week:number})[]>("SELECT COUNT(*) total, SUM(is_active = TRUE) active, SUM(role = 'ADMIN') admins, SUM(DATE(created_at) = CURRENT_DATE) new_today, SUM(last_login_at >= NOW() - INTERVAL 7 DAY) signed_in_week FROM users"),
    db.query<AdminUserRow[]>("SELECT u.id,u.email,u.display_name,u.role,u.is_active,u.created_at,u.updated_at,u.last_login_at,u.last_seen_at,COUNT(DISTINCT t.id) tracker_count,COUNT(DISTINCT e.id) entry_count,COUNT(DISTINCT CASE WHEN e.status='COMPLETE' THEN e.id END) completed_count FROM users u LEFT JOIN trackers t ON t.user_id=u.id LEFT JOIN tracker_entries e ON e.user_id=u.id GROUP BY u.id ORDER BY u.created_at DESC LIMIT 500"),
    db.query<(RowDataPacket&{id:number;action:string;created_at:Date;actor_name:string|null;target_name:string|null})[]>("SELECT a.id,a.action,a.created_at,COALESCE(actor.display_name,actor.email) actor_name,COALESCE(target.display_name,target.email) target_name FROM admin_audit_logs a LEFT JOIN users actor ON actor.id=a.actor_user_id LEFT JOIN users target ON target.id=a.target_user_id ORDER BY a.created_at DESC LIMIT 20"),
  ]);
  const stats=statsResult[0][0];
  return {
    stats:{total:Number(stats.total),active:Number(stats.active),admins:Number(stats.admins),newToday:Number(stats.new_today),signedInWeek:Number(stats.signed_in_week)},
    users:usersResult[0].map(mapUser),
    events:eventsResult[0].map(row=>({id:Number(row.id),action:row.action,createdAt:row.created_at.toISOString(),actorName:row.actor_name,targetName:row.target_name})),
  };
}

export async function getAdminUser(userId:number){
  const [rows]=await getDb().query<AdminUserRow[]>("SELECT u.id,u.email,u.display_name,u.role,u.is_active,u.created_at,u.updated_at,u.last_login_at,u.last_seen_at,COUNT(DISTINCT t.id) tracker_count,COUNT(DISTINCT e.id) entry_count,COUNT(DISTINCT CASE WHEN e.status='COMPLETE' THEN e.id END) completed_count FROM users u LEFT JOIN trackers t ON t.user_id=u.id LEFT JOIN tracker_entries e ON e.user_id=u.id WHERE u.id=? GROUP BY u.id LIMIT 1",[userId]);
  return rows[0]?mapUser(rows[0]):null;
}

export async function updateManagedUser(input:{actorId:number;targetId:number;role?:UserRole;isActive?:boolean}){
  if(input.actorId===input.targetId)throw new Error("SELF_MANAGEMENT_NOT_ALLOWED");
  const connection=await getDb().getConnection();
  try{
    await connection.beginTransaction();
    const [activeAdmins]=await connection.query<RowDataPacket[]>("SELECT id FROM users WHERE role='ADMIN' AND is_active=TRUE ORDER BY id FOR UPDATE");
    const [targetRows]=await connection.query<(RowDataPacket&{role:UserRole;is_active:number})[]>("SELECT role,is_active FROM users WHERE id=? LIMIT 1 FOR UPDATE",[input.targetId]);
    const target=targetRows[0];if(!target)throw new Error("USER_NOT_FOUND");
    const removesActiveAdmin=target.role==="ADMIN"&&Boolean(target.is_active)&&((input.role&&input.role!=="ADMIN")||input.isActive===false);
    if(removesActiveAdmin&&activeAdmins.length<=1)throw new Error("LAST_ADMIN");
    const updates:string[]=[];const values:Array<string|number|boolean>=[];
    if(input.role){updates.push("role=?");values.push(input.role)}
    if(typeof input.isActive==="boolean"){updates.push("is_active=?");values.push(input.isActive)}
    if(!updates.length)throw new Error("NO_CHANGES");
    updates.push("session_version=session_version+1");values.push(input.targetId);
    await connection.execute<ResultSetHeader>(`UPDATE users SET ${updates.join(",")} WHERE id=?`,values);
    await connection.execute("INSERT INTO admin_audit_logs (actor_user_id,target_user_id,action,metadata) VALUES (?,?,?,?)",[input.actorId,input.targetId,"USER_ACCESS_UPDATED",JSON.stringify({role:input.role,isActive:input.isActive})]);
    await connection.commit();
  }catch(error){await connection.rollback();throw error}finally{connection.release()}
  return getAdminUser(input.targetId);
}

export async function recordAuditEvent(input:{actorId?:number|null;targetId?:number|null;action:string;metadata?:unknown}){
  await getDb().execute("INSERT INTO admin_audit_logs (actor_user_id,target_user_id,action,metadata) VALUES (?,?,?,?)",[input.actorId??null,input.targetId??null,input.action,input.metadata===undefined?null:JSON.stringify(input.metadata)]);
}
