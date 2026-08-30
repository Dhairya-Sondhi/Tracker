import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/users";
import { getUserAnalytics,type AnalyticsPeriod } from "@/lib/analytics";

const allowed=new Set([7,30,90,365]);export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});const requested=Number(new URL(request.url).searchParams.get("days")||30);const days=(allowed.has(requested)?requested:30) as AnalyticsPeriod;try{return NextResponse.json(await getUserAnalytics(user.id,days),{headers:{"Cache-Control":"no-store"}})}catch(error){console.error("Analytics load failed",error);return NextResponse.json({message:"Unable to load analytics."},{status:503})}}
