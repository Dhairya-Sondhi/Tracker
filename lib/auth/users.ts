import { createSupabaseServerClient,getSupabaseAdmin } from "@/lib/supabase/server";
import type { SafeUser,UserRole } from "@/lib/auth/types";

type UserRow={id:number;auth_user_id:string;email:string;display_name:string|null;role:UserRole;is_active:boolean;session_version:number;created_at:string};
const normalizeEmail=(email:string)=>email.trim().toLowerCase();
const safe=(row:UserRow):SafeUser=>({id:Number(row.id),email:row.email,displayName:row.display_name,role:row.role,isActive:Boolean(row.is_active),sessionVersion:Number(row.session_version),createdAt:new Date(row.created_at)});
export class DuplicateEmailError extends Error{}
export class InvalidCredentialsError extends Error{}
export class DisabledAccountError extends Error{}

async function profileForAuthId(authUserId:string){
 const {data,error}=await getSupabaseAdmin().from("users").select("id,auth_user_id,email,display_name,role,is_active,session_version,created_at").eq("auth_user_id",authUserId).maybeSingle<UserRow>();
 if(error)throw error;return data?safe(data):null;
}

export async function createUser(input:{displayName:string;email:string;password:string}){
 const supabase=await createSupabaseServerClient(),email=normalizeEmail(input.email),displayName=input.displayName.trim();
 const {data,error}=await supabase.auth.signUp({email,password:input.password,options:{data:{display_name:displayName,timezone:"Asia/Kolkata"}}});
 if(error){if(/already registered|already exists/i.test(error.message))throw new DuplicateEmailError();throw error}
 if(!data.user)throw new Error("SUPABASE_SIGNUP_MISSING_USER");
 const profile=await profileForAuthId(data.user.id);if(!profile)throw new Error("SUPABASE_PROFILE_TRIGGER_FAILED");
 return {...profile,emailConfirmationRequired:!data.session};
}

export async function authenticateUser(emailInput:string,password:string){
 const supabase=await createSupabaseServerClient();
 const {data,error}=await supabase.auth.signInWithPassword({email:normalizeEmail(emailInput),password});
 if(error||!data.user)throw new InvalidCredentialsError();
 const user=await profileForAuthId(data.user.id);if(!user)throw new InvalidCredentialsError();
 if(!user.isActive){await supabase.auth.signOut();throw new DisabledAccountError()}
 const admin=getSupabaseAdmin();await Promise.all([
  admin.from("users").update({last_login_at:new Date().toISOString(),last_seen_at:new Date().toISOString()}).eq("id",user.id),
  admin.from("admin_audit_logs").insert({actor_user_id:user.id,target_user_id:user.id,action:"USER_SIGNED_IN"}),
 ]);
 return user;
}

export async function findUserById(id:number){
 const {data,error}=await getSupabaseAdmin().from("users").select("id,auth_user_id,email,display_name,role,is_active,session_version,created_at").eq("id",id).maybeSingle<UserRow>();
 if(error)throw error;return data?safe(data):null;
}

export async function requireUser(){
 const supabase=await createSupabaseServerClient();const {data,error}=await supabase.auth.getUser();
 if(error||!data.user)return null;const user=await profileForAuthId(data.user.id);return user?.isActive?user:null;
}
export async function requireRole(role:UserRole){const user=await requireUser();return user?.role===role?user:null}
export async function userCounts(){const admin=getSupabaseAdmin();const [{count:total},{count:active},{count:admins}]=await Promise.all([admin.from("users").select("id",{head:true,count:"exact"}),admin.from("users").select("id",{head:true,count:"exact"}).eq("is_active",true),admin.from("users").select("id",{head:true,count:"exact"}).eq("role","ADMIN")]);return {total:total||0,active:active||0,admins:admins||0}}
