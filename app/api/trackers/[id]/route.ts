import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/users";
import { saveTrackerEntry } from "@/lib/trackers";

const entrySchema=z.object({status:z.enum(["complete","partial","missed","skip","rest","none"]),value:z.number().min(0).max(1000000),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()});
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});const trackerId=Number((await params).id);const parsed=entrySchema.safeParse(await request.json().catch(()=>null));if(!Number.isSafeInteger(trackerId)||!parsed.success)return NextResponse.json({message:"Invalid entry."},{status:400});try{return NextResponse.json({entry:await saveTrackerEntry(user.id,trackerId,parsed.data)})}catch(error){if(error instanceof Error&&error.message==="TRACKER_NOT_FOUND")return NextResponse.json({message:"Tracker not found."},{status:404});console.error("Tracker update failed",error);return NextResponse.json({message:"Unable to save this check-in."},{status:503})}}
