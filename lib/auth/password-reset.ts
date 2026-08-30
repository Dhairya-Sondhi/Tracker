import { createHash, randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

const digest=(token:string)=>createHash("sha256").update(token).digest();

async function deliverResetEmail(email:string,link:string){
  const key=process.env.RESEND_API_KEY,from=process.env.AUTH_FROM_EMAIL;
  if(!key||!from){if(process.env.NODE_ENV!=="production")return;throw new Error("PASSWORD_EMAIL_NOT_CONFIGURED")}
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[email],subject:"Reset your Form password",html:`<p>Use this secure link to reset your password. It expires in 30 minutes.</p><p><a href="${link}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error("PASSWORD_EMAIL_FAILED");
}

export async function requestPasswordReset(emailInput:string){
  const email=emailInput.trim().toLowerCase();const db=getDb();const [users]=await db.query<(RowDataPacket&{id:number;email:string;is_active:number})[]>("SELECT id,email,is_active FROM users WHERE email=? LIMIT 1",[email]);const user=users[0];if(!user||!user.is_active)return null;
  const [recent]=await db.query<RowDataPacket[]>("SELECT id FROM password_reset_tokens WHERE user_id=? AND created_at>NOW()-INTERVAL 60 SECOND LIMIT 1",[user.id]);if(recent.length)return null;
  const token=randomBytes(32).toString("base64url");const tokenHash=digest(token);await db.execute("INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES (?,?,NOW()+INTERVAL 30 MINUTE)",[user.id,tokenHash]);
  const base=(process.env.APP_URL||"http://localhost:3000").replace(/\/$/,"");const link=`${base}/reset-password?token=${encodeURIComponent(token)}`;try{await deliverResetEmail(user.email,link)}catch(error){await db.execute("DELETE FROM password_reset_tokens WHERE token_hash=?",[tokenHash]);throw error}return process.env.NODE_ENV!=="production"?link:null;
}

export async function resetPassword(token:string,password:string){
  const db=getDb();const passwordHash=await hashPassword(password);const connection=await db.getConnection();
  try{await connection.beginTransaction();const [rows]=await connection.query<(RowDataPacket&{id:number;user_id:number})[]>("SELECT id,user_id FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>NOW() LIMIT 1 FOR UPDATE",[digest(token)]);const reset=rows[0];if(!reset){await connection.rollback();return false}await connection.execute("UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?",[passwordHash,reset.user_id]);await connection.execute("UPDATE password_reset_tokens SET used_at=NOW() WHERE id=?",[reset.id]);await connection.execute("UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=? AND used_at IS NULL",[reset.user_id]);await connection.execute("INSERT INTO admin_audit_logs (target_user_id,action) VALUES (?,?)",[reset.user_id,"PASSWORD_RESET_COMPLETED"]);await connection.commit();return true}catch(error){await connection.rollback();throw error}finally{connection.release()}
}
