import { cookies } from "next/headers";
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { getAuthEnv } from "@/lib/env";
import type { SessionPayload } from "@/lib/auth/types";

export const SESSION_COOKIE="form_session";
const expiresIn=60*60*24*7;
const key=()=>new TextEncoder().encode(getAuthEnv().AUTH_SECRET);
export async function createSession(payload:SessionPayload){const token=await new SignJWT({role:payload.role,sessionVersion:payload.sessionVersion}).setProtectedHeader({alg:"HS256"}).setSubject(String(payload.userId)).setIssuedAt().setExpirationTime(`${expiresIn}s`).sign(key());(await cookies()).set(SESSION_COOKIE,token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:expiresIn})}
export async function readSessionToken(token?:string):Promise<SessionPayload|null>{try{if(!token)return null;const {payload}=await jwtVerify(token,key(),{algorithms:["HS256"]});const userId=Number(payload.sub),sessionVersion=Number(payload.sessionVersion);if(!Number.isSafeInteger(userId)||!Number.isSafeInteger(sessionVersion)||(payload.role!=="ADMIN"&&payload.role!=="USER"))return null;return {userId,role:payload.role,sessionVersion}}catch{return null}}
export async function getSession(){return readSessionToken((await cookies()).get(SESSION_COOKIE)?.value)}
export async function destroySession(){(await cookies()).delete(SESSION_COOKIE)}
