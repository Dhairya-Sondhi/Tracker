import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/users";
import { saveTrackerEntry,updateTrackerDefinition } from "@/lib/trackers";

const entrySchema=z.object({status:z.enum(["complete","partial","missed","skip","rest","none"]),value:z.number().min(0).max(1000000),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()});
const definitionSchema=z.object({operation:z.literal("definition"),name:z.string().trim().min(1).max(140),detail:z.string().trim().max(255),kind:z.enum(["boolean","number","duration","rating"]),target:z.number().positive().max(1000000),unit:z.string().trim().max(30)});
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const [user,body,{id}]=await Promise.all([requireUser(),request.json().catch(()=>null),params]);if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});const trackerId=Number(id);if(!Number.isSafeInteger(trackerId))return NextResponse.json({message:"Invalid tracker."},{status:400});try{const definition=definitionSchema.safeParse(body);if(definition.success)return NextResponse.json({tracker:await updateTrackerDefinition(user.id,trackerId,definition.data)});const entry=entrySchema.safeParse(body);if(!entry.success)return NextResponse.json({message:"Invalid tracker update."},{status:400});return NextResponse.json({entry:await saveTrackerEntry(user.id,trackerId,entry.data)})}catch(error){if(error instanceof Error&&error.message==="TRACKER_NOT_FOUND")return NextResponse.json({message:"Tracker not found."},{status:404});console.error("Tracker update failed",error);return NextResponse.json({message:"Unable to save this tracker."},{status:503})}}
