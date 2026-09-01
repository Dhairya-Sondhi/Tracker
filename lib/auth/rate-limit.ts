import { createHmac } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/env";

type Rule={scope:string;subject:string;limit:number;windowSeconds:number;blockSeconds:number};
export class RateLimitExceededError extends Error{constructor(public readonly retryAfter:number){super("RATE_LIMIT_EXCEEDED")}}
const positiveInteger=(value:number,name:string)=>{if(!Number.isSafeInteger(value)||value<1)throw new Error(`${name} must be a positive integer.`);return value};
const keyFor=(scope:string,subject:string)=>createHmac("sha256",getSupabaseEnv().SUPABASE_SECRET_KEY).update(`${scope}\0${subject}`).digest("hex");
export function requestAddress(request:Request){const candidate=request.headers.get("cf-connecting-ip")||request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";return candidate.trim().slice(0,128)||"unknown"}
export async function consumeRateLimit(rule:Rule){
 const limit=positiveInteger(rule.limit,"limit"),windowSeconds=positiveInteger(rule.windowSeconds,"windowSeconds"),blockSeconds=positiveInteger(rule.blockSeconds,"blockSeconds");
 const {data,error}=await getSupabaseAdmin().rpc("consume_auth_rate_limit",{p_scope:rule.scope,p_key_hash:keyFor(rule.scope,rule.subject),p_limit:limit,p_window_seconds:windowSeconds,p_block_seconds:blockSeconds});
 if(error)throw error;const state=Array.isArray(data)?data[0]:data;
 if(state&&(Number(state.retry_after)>0||Number(state.attempts)>limit))throw new RateLimitExceededError(Math.max(1,Number(state.retry_after)||blockSeconds));
}
export async function enforceRateLimits(rules:Rule[]){for(const rule of rules)await consumeRateLimit(rule)}
