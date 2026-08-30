import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

const globalForSupabase=globalThis as typeof globalThis&{supabaseAdmin?:SupabaseClient};

/**
 * Server-only Supabase client. Its secret key bypasses Row Level Security, so
 * callers must authenticate and authorize the current app user before queries.
 */
export function getSupabaseAdmin():SupabaseClient{
 if(globalForSupabase.supabaseAdmin)return globalForSupabase.supabaseAdmin;
 const env=getSupabaseEnv();
 const client=createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,{
  auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false},
 });
 globalForSupabase.supabaseAdmin=client;
 return client;
}

export async function checkSupabaseConnection():Promise<void>{
 const {error}=await getSupabaseAdmin().auth.admin.listUsers({page:1,perPage:1});
 if(error)throw new Error(`Supabase connection failed: ${error.message}`);
}
