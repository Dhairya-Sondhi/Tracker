import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/users";
import { getPlan,savePlan,type PlanRange } from "@/lib/week-plans";

const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/),item=z.object({trackerId:z.number().int().positive(),date}),schema=z.object({range:z.enum(["week","month"]),anchor:date,items:z.array(item).max(1000)});export const runtime="nodejs";export const dynamic="force-dynamic";
const rangeFrom=(request:Request):PlanRange=>new URL(request.url).searchParams.get("range")==="month"?"month":"week";
export async function GET(request:Request){const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});const url=new URL(request.url),range=rangeFrom(request),anchor=url.searchParams.get("anchor")||new Date().toISOString().slice(0,10);if(!date.safeParse(anchor).success)return NextResponse.json({message:"Invalid date."},{status:400});return NextResponse.json({range,anchor,items:await getPlan(user.id,range,anchor)},{headers:{"Cache-Control":"no-store"}})}
export async function PUT(request:Request){const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Invalid plan."},{status:400});try{await savePlan(user.id,parsed.data.range,parsed.data.anchor,parsed.data.items);return NextResponse.json({success:true})}catch(error){console.error("Plan save failed",error);return NextResponse.json({message:"Unable to save your plan."},{status:400})}}
