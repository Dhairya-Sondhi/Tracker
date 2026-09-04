import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { dueKinds,localScheduleState,type NotificationKind } from "@/lib/notification-schedule";

type SettingsRow={user_id:number|string;timezone:string;email_digest:"OFF"|"DAILY"|"WEEKLY";weekly_review_reminder:boolean;daily_reminder_time:string|null;week_start_day:number};
type UserRow={id:number|string;email:string;display_name:string|null;is_active:boolean};
type DueNotification={user:UserRow;kind:NotificationKind;periodKey:string;startDate:string;endDate:string};
type EntryRow={tracker_id:number|string;status:string};
type TrackerRow={id:number|string;name:string};

const htmlEscape=(value:string)=>value.replace(/[&<>'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]!);
const shiftDate=(key:string,days:number)=>{const date=new Date(`${key}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10)};

function dateRange(kind:NotificationKind,today:string){
 if(kind==="DAILY_PROGRESS")return {startDate:today,endDate:today};
 const endDate=kind==="WEEKLY_PROGRESS"?shiftDate(today,-1):today;
 return {startDate:shiftDate(endDate,-6),endDate};
}

async function allSettings(){
 const admin=getSupabaseAdmin(),rows:SettingsRow[]=[];let start=0;
 for(;;){const {data,error}=await admin.from("user_settings").select("user_id,timezone,email_digest,weekly_review_reminder,daily_reminder_time,week_start_day").range(start,start+999);if(error)throw error;const page=(data||[]) as SettingsRow[];rows.push(...page);if(page.length<1000)return rows;start+=1000}
}

async function dueNotifications(now:Date){
 const settings=await allSettings(),ids=settings.map(row=>Number(row.user_id));if(!ids.length)return [];
 const {data,error}=await getSupabaseAdmin().from("users").select("id,email,display_name,is_active").in("id",ids).eq("is_active",true);if(error)throw error;
 const users=new Map(((data||[]) as UserRow[]).map(user=>[Number(user.id),user])),due:DueNotification[]=[];
 for(const preference of settings){const user=users.get(Number(preference.user_id));if(!user)continue;let state:ReturnType<typeof localScheduleState>;try{state=localScheduleState(now,preference.timezone||"Asia/Kolkata")}catch{console.warn("Skipping notification with invalid timezone",{userId:preference.user_id});continue}
  for(const kind of dueKinds(preference,state)){const range=dateRange(kind,state.date);due.push({user,kind,periodKey:kind==="DAILY_PROGRESS"?state.date:`${range.startDate}:${range.endDate}`,...range})}
 }
 return due;
}

async function claim(item:DueNotification){
 const {data,error}=await getSupabaseAdmin().rpc("claim_notification_delivery",{p_user_id:Number(item.user.id),p_kind:item.kind,p_period_key:item.periodKey});if(error)throw error;
 const value=Array.isArray(data)?data[0]:data;return value===null||value===undefined?null:Number(value);
}

async function summary(userId:number,startDate:string,endDate:string){
 const admin=getSupabaseAdmin(),[{data:trackers,error:trackerError},{data:entries,error:entryError}]=await Promise.all([
  admin.from("trackers").select("id,name").eq("user_id",userId).eq("is_archived",false),
  admin.from("tracker_entries").select("tracker_id,status").eq("user_id",userId).gte("entry_date",startDate).lte("entry_date",endDate),
 ]);if(trackerError)throw trackerError;if(entryError)throw entryError;
 const trackerRows=(trackers||[]) as TrackerRow[],entryRows=(entries||[]) as EntryRow[],names=new Map(trackerRows.map(row=>[Number(row.id),row.name]));
 const completed=entryRows.filter(row=>row.status==="COMPLETE"),partial=entryRows.filter(row=>row.status==="PARTIAL"),missed=entryRows.filter(row=>row.status==="MISSED");
 return {trackerCount:trackerRows.length,completed:completed.length,partial:partial.length,missed:missed.length,completedNames:[...new Set(completed.map(row=>names.get(Number(row.tracker_id))).filter((name):name is string=>Boolean(name)))].slice(0,5)};
}

function appUrl(){const raw=process.env.APP_URL?.trim()||"http://localhost:3000";try{return new URL(raw).origin}catch{return "http://localhost:3000"}}
function label(kind:NotificationKind){return kind==="DAILY_PROGRESS"?"Daily progress":kind==="WEEKLY_PROGRESS"?"Weekly progress":"Weekly review"}

async function message(item:DueNotification){
 const stats=await summary(Number(item.user.id),item.startDate,item.endDate),name=htmlEscape(item.user.display_name?.trim()||item.user.email.split("@")[0]),title=label(item.kind),review=item.kind==="WEEKLY_REVIEW";
 const subject=review?"Your Vlocity weekly review is ready":`${title}: ${stats.completed} completed check-in${stats.completed===1?"":"s"}`;
 const intro=review?"Take a few minutes to notice what moved, what stalled, and what deserves your attention next.":`Here’s your ${item.kind==="DAILY_PROGRESS"?"day":"week"} at a glance.`;
 const names=stats.completedNames.length?`<p style="margin:24px 0 0;color:#c8c4d5;font-size:14px;line-height:1.6"><strong style="color:#ffffff">Momentum:</strong> ${stats.completedNames.map(htmlEscape).join(", ")}</p>`:"";
 const href=`${appUrl()}${review?"/today":"/dashboard"}`;
 const html=`<!doctype html><html><body style="margin:0;background:#0e0d13;color:#ffffff;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="border:1px solid #302d3a;border-radius:24px;background:#17151f;padding:32px"><p style="margin:0;color:#b9a7ff;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Vlocity · ${title}</p><h1 style="margin:16px 0 12px;font-size:28px;line-height:1.2">Hi ${name}, keep the signal clear.</h1><p style="margin:0;color:#aaa5b8;font-size:15px;line-height:1.7">${intro}</p><div style="display:grid;margin:28px 0 0;border:1px solid #302d3a;border-radius:16px;overflow:hidden"><div style="padding:18px 20px;border-bottom:1px solid #302d3a"><strong style="font-size:24px">${stats.completed}</strong><span style="margin-left:8px;color:#aaa5b8;font-size:13px">completed</span></div><div style="padding:18px 20px"><span style="color:#aaa5b8;font-size:13px">${stats.partial} partial · ${stats.missed} missed · ${stats.trackerCount} active trackers</span></div></div>${names}<a href="${href}" style="display:inline-block;margin-top:28px;border-radius:12px;background:#ffffff;color:#0e0d13;padding:14px 20px;font-size:14px;font-weight:700;text-decoration:none">${review?"Plan the next week":"Open dashboard"}</a></div><p style="margin:18px 8px 0;color:#777282;font-size:11px;line-height:1.6">You’re receiving this because email notifications are enabled in Vlocity Settings. You can change them at any time.</p></div></body></html>`;
 const text=`${title}\n\nHi ${item.user.display_name?.trim()||item.user.email.split("@")[0]},\n\n${intro}\n\nCompleted: ${stats.completed}\nPartial: ${stats.partial}\nMissed: ${stats.missed}\nActive trackers: ${stats.trackerCount}\n\n${review?"Plan the next week":"Open dashboard"}: ${href}\n\nChange email notifications in Vlocity Settings.`;
 return {subject,html,text};
}

export async function sendTestNotification(user:{id:number;email:string;displayName:string|null}){
 const name=htmlEscape(user.displayName?.trim()||user.email.split("@")[0]),href=`${appUrl()}/settings`;
 return sendEmail({to:user.email,subject:"Vlocity email notifications are ready",idempotencyKey:`test/${user.id}/${crypto.randomUUID()}`,html:`<!doctype html><html><body style="margin:0;background:#0e0d13;color:#fff;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="border:1px solid #302d3a;border-radius:24px;background:#17151f;padding:32px"><p style="margin:0;color:#b9a7ff;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Vlocity · Test email</p><h1 style="margin:16px 0 12px;font-size:28px">It works, ${name}.</h1><p style="color:#aaa5b8;line-height:1.7">Your progress summaries and review reminders can now reach this inbox.</p><a href="${href}" style="display:inline-block;margin-top:20px;border-radius:12px;background:#fff;color:#0e0d13;padding:14px 20px;font-weight:700;text-decoration:none">Review notification settings</a></div></div></body></html>`,text:`It works, ${user.displayName?.trim()||user.email.split("@")[0]}. Your Vlocity email notifications can now reach this inbox. Review settings: ${href}`});
}

export async function runScheduledNotifications(now=new Date()){
 const due=await dueNotifications(now),result={due:due.length,sent:0,failed:0,skipped:0};
 for(const item of due){let deliveryId:number|null=null;try{deliveryId=await claim(item);if(deliveryId===null){result.skipped++;continue}const content=await message(item),providerId=await sendEmail({to:item.user.email,...content,idempotencyKey:`vlocity/${item.kind}/${item.user.id}/${item.periodKey}`});const {error}=await getSupabaseAdmin().from("notification_deliveries").update({status:"SENT",provider_message_id:providerId,sent_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()}).eq("id",deliveryId);if(error)throw error;result.sent++}catch(error){result.failed++;console.error("Notification delivery failed",{userId:item.user.id,kind:item.kind,error});if(deliveryId!==null)await getSupabaseAdmin().from("notification_deliveries").update({status:"FAILED",last_error:error instanceof Error?error.message.slice(0,500):"Unknown delivery error",updated_at:new Date().toISOString()}).eq("id",deliveryId)}
 }
 return result;
}
