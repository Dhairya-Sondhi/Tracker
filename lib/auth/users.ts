import type { ResultSetHeader,RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { hashPassword,verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import type { SafeUser,UserRole } from "@/lib/auth/types";
import { ensureStarterTrackers } from "@/lib/trackers";

interface UserRow extends RowDataPacket{id:number;email:string;password_hash:string;display_name:string|null;role:UserRole;is_active:number;session_version:number;created_at:Date}
const normalizeEmail=(email:string)=>email.trim().toLowerCase();
const safe=(row:UserRow):SafeUser=>({id:Number(row.id),email:row.email,displayName:row.display_name,role:row.role,isActive:Boolean(row.is_active),sessionVersion:Number(row.session_version),createdAt:row.created_at});
export class DuplicateEmailError extends Error{}
export class InvalidCredentialsError extends Error{}
export class DisabledAccountError extends Error{}

export async function createUser(input:{displayName:string;email:string;password:string}){const email=normalizeEmail(input.email);const displayName=input.displayName.trim()||null;const role:UserRole="USER";const [passwordHash,[existing]]=await Promise.all([hashPassword(input.password),getDb().execute<RowDataPacket[]>("SELECT id FROM users WHERE email = ? LIMIT 1",[email])]);if(existing.length)throw new DuplicateEmailError();const connection=await getDb().getConnection();try{await connection.beginTransaction();const [result]=await connection.execute<ResultSetHeader>("INSERT INTO users (email,password_hash,display_name,role) VALUES (?,?,?,?)",[email,passwordHash,displayName,role]);const id=Number(result.insertId);await ensureStarterTrackers(id,connection);await connection.execute("INSERT INTO admin_audit_logs (target_user_id,action) VALUES (?,?)",[id,"USER_SIGNED_UP"]);await connection.commit();return {id,email,displayName,role,isActive:true,sessionVersion:1,createdAt:new Date()} satisfies SafeUser}catch(error){await connection.rollback();if((error as {code?:string}).code==="ER_DUP_ENTRY")throw new DuplicateEmailError();throw error}finally{connection.release()}}
export async function authenticateUser(emailInput:string,password:string){const email=normalizeEmail(emailInput);const [rows]=await getDb().execute<UserRow[]>("SELECT id,email,password_hash,display_name,role,is_active,session_version,created_at FROM users WHERE email = ? LIMIT 1",[email]);const row=rows[0];if(!row)throw new InvalidCredentialsError();if(!row.is_active)throw new DisabledAccountError();if(!await verifyPassword(password,row.password_hash))throw new InvalidCredentialsError();await Promise.all([getDb().execute("UPDATE users SET last_login_at=NOW(),last_seen_at=NOW() WHERE id=?",[row.id]),getDb().execute("INSERT INTO admin_audit_logs (actor_user_id,target_user_id,action) VALUES (?,?,?)",[row.id,row.id,"USER_SIGNED_IN"])]);return safe(row)}
export async function findUserById(id:number){const [rows]=await getDb().execute<UserRow[]>("SELECT id,email,password_hash,display_name,role,is_active,session_version,created_at FROM users WHERE id = ? LIMIT 1",[id]);return rows[0]?safe(rows[0]):null}
export async function requireUser(){const session=await getSession();if(!session)return null;const user=await findUserById(session.userId);return user?.isActive&&user.sessionVersion===session.sessionVersion?user:null}
export async function requireRole(role:UserRole){const user=await requireUser();return user?.role===role?user:null}
export async function userCounts(){const [rows]=await getDb().query<(RowDataPacket&{total:number;active:number;admins:number})[]>("SELECT COUNT(*) total, SUM(is_active = TRUE) active, SUM(role = 'ADMIN') admins FROM users");return rows[0]}
