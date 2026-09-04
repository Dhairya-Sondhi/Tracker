import { createClient } from "@supabase/supabase-js";
import { loadEnvironment } from "./env-file.mjs";

const env=loadEnvironment(),required=["SUPABASE_URL","SUPABASE_SECRET_KEY"];
const missing=required.filter(key=>!env[key]?.trim());
if(missing.length)throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
const client=createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const contracts={
 users:"id,auth_user_id,email,display_name,role,is_active,session_version,last_login_at,last_seen_at",
 trackers:"id,user_id,name,detail,type,target_value,unit,sort_order,is_archived",
 tracker_entries:"id,tracker_id,user_id,entry_date,numeric_value,boolean_value,status",
 weekly_plan_items:"id,user_id,tracker_id,planned_date",
 user_top_focus:"user_id,tracker_id,updated_at",
 user_settings:"user_id,theme,default_planning_view,week_start_day,animations_enabled,compact_mode,timezone,email_digest,weekly_review_reminder,daily_reminder_time",
 admin_audit_logs:"id,actor_user_id,target_user_id,action,metadata,created_at",
 auth_rate_limits:"scope,key_hash,window_started_at,attempts,blocked_until",
 notification_deliveries:"id,user_id,kind,period_key,status,attempts,provider_message_id,last_error,sent_at,created_at,updated_at",
};
for(const [table,columns] of Object.entries(contracts)){const {error}=await client.from(table).select(columns,{head:true,count:"exact"}).limit(1);if(error)throw new Error(`${table}: ${error.message}`)}
const schemaResponse=await fetch(`${env.SUPABASE_URL.replace(/\/$/,"")}/rest/v1/`,{headers:{apikey:env.SUPABASE_SECRET_KEY,Authorization:`Bearer ${env.SUPABASE_SECRET_KEY}`,Accept:"application/openapi+json"}});
if(!schemaResponse.ok)throw new Error(`PostgREST schema discovery failed with HTTP ${schemaResponse.status}.`);
const openApi=await schemaResponse.json();
const functions=["consume_auth_rate_limit","replace_weekly_plan","update_managed_user","update_user_settings","claim_notification_delivery"];
const missingFunctions=functions.filter(name=>!openApi.paths?.[`/rpc/${name}`]);
if(missingFunctions.length)throw new Error(`Missing database functions: ${missingFunctions.join(", ")}`);
process.stdout.write(`Supabase smoke check passed for ${Object.keys(contracts).length} table contracts and ${functions.length} database functions.\n`);
