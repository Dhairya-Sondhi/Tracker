import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/users";
import { getTopFocus,setTopFocus } from "@/lib/focus";

const schema=z.object({trackerId:z.number().int().positive().nullable()});export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});return NextResponse.json({trackerId:await getTopFocus(user.id)},{headers:{"Cache-Control":"no-store"}})}
export async function PUT(request:Request){const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Invalid focus."},{status:400});try{return NextResponse.json({trackerId:await setTopFocus(user.id,parsed.data.trackerId)})}catch{return NextResponse.json({message:"Tracker not found."},{status:404})}}
