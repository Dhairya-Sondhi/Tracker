import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv,getSupabasePublicEnv } from "@/lib/env";

const globalForSupabase=globalThis as typeof globalThis&{supabaseAdmin?:SupabaseClient};

export async function createSupabaseServerClient(){
 const store=await cookies(),env=getSupabasePublicEnv();
 return createServerClient(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>store.getAll(),setAll(values){try{for(const {name,value,options} of values)store.set(name,value,options)}catch{/* Server Components cannot write cookies; Proxy refreshes them. */}}}});
}

/** Secret-key client. Callers must authenticate and scope every user-facing query. */
export function getSupabaseAdmin():SupabaseClient{
 if(globalForSupabase.supabaseAdmin)return globalForSupabase.supabaseAdmin;
 const env=getSupabaseEnv();
 globalForSupabase.supabaseAdmin=createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
 return globalForSupabase.supabaseAdmin;
}

export function assertSupabase<T>(result:{data:T;error:null}|{data:T|null;error:{message:string;code?:string}}):T{
 if(result.error)throw new Error(`SUPABASE_QUERY_FAILED: ${result.error.code||"unknown"} ${result.error.message}`);
 return result.data as T;
}

export async function checkSupabaseConnection(){
 const {error}=await getSupabaseAdmin().from("users").select("id",{head:true,count:"exact"}).limit(1);
 if(error)throw new Error(`Supabase connection failed: ${error.message}`);
}
