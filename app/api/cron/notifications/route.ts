import { runScheduledNotifications } from "@/lib/notification-email";

export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=60;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET?.trim();
 if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return Response.json({success:false,message:"Unauthorized"},{status:401});
 try{return Response.json({success:true,...await runScheduledNotifications()},{headers:{"Cache-Control":"no-store"}})}catch(error){console.error("Notification scheduler failed",error);return Response.json({success:false,message:"Notification scheduler failed."},{status:503})}
}
