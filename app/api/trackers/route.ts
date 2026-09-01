import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/users";
import { createTracker,getUserTrackers } from "@/lib/trackers";
import { getTopFocus } from "@/lib/focus";
import { assertSupabase,getSupabaseAdmin } from "@/lib/supabase/server";

const createSchema=z.object({name:z.string().trim().min(1).max(140),detail:z.string().trim().max(255),kind:z.enum(["boolean","number","duration","rating"]),target:z.number().positive().max(1000000),unit:z.string().trim().max(30)});
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});try{const [trackers,topFocusId,settingsResult]=await Promise.all([getUserTrackers(user.id),getTopFocus(user.id),getSupabaseAdmin().from("user_settings").select("timezone").eq("user_id",user.id).maybeSingle()]);const settings=assertSupabase(settingsResult) as {timezone:string}|null;return NextResponse.json({user:{displayName:user.displayName,email:user.email,timezone:settings?.timezone||"Asia/Kolkata"},trackers,topFocusId},{headers:{"Cache-Control":"no-store"}})}catch(error){console.error("Tracker load failed",error);return NextResponse.json({message:"Unable to load your trackers."},{status:503})}}
export async function POST(request:Request){const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});const parsed=createSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Invalid tracker."},{status:400});try{return NextResponse.json({tracker:await createTracker(user.id,parsed.data)},{status:201})}catch(error){console.error("Tracker creation failed",error);return NextResponse.json({message:"Unable to create this tracker."},{status:503})}}
