import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){const started=Date.now();try{await getDb().query({sql:"SELECT 1 AS ready",timeout:3000});return NextResponse.json({status:"ok",database:"ready",latencyMs:Date.now()-started},{headers:{"Cache-Control":"no-store"}})}catch(error){console.error("Database readiness check failed",error);return NextResponse.json({status:"degraded",database:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}}
