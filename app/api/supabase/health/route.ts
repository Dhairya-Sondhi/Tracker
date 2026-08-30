import { NextResponse } from "next/server";
import { checkSupabaseConnection } from "@/lib/supabase/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 const started=Date.now();
 try{
  await checkSupabaseConnection();
  return NextResponse.json(
   {status:"ok",supabase:"ready",latencyMs:Date.now()-started},
   {headers:{"Cache-Control":"no-store"}},
  );
 }catch(error){
  console.error("Supabase readiness check failed",error);
  return NextResponse.json(
   {status:"degraded",supabase:"unavailable"},
   {status:503,headers:{"Cache-Control":"no-store"}},
  );
 }
}
