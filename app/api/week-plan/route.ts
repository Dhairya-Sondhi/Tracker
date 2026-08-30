import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/users";
import { getWeekPlan, saveWeekPlan } from "@/lib/week-plans";

const schema=z.object({items:z.array(z.object({trackerId:z.number().int().positive(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)})).max(500)});export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});return NextResponse.json({items:await getWeekPlan(user.id)},{headers:{"Cache-Control":"no-store"}})}
export async function PUT(request:Request){const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Invalid plan."},{status:400});try{await saveWeekPlan(user.id,parsed.data.items);return NextResponse.json({success:true})}catch(error){console.error("Week plan save failed",error);return NextResponse.json({message:"Unable to save your week plan."},{status:400})}}
