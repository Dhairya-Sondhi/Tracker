import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
export const runtime="nodejs";
export async function GET(){if(process.env.NODE_ENV==="production")return NextResponse.json({success:false,message:"Not found"},{status:404});try{await getDb().query("SELECT 1 AS connected");return NextResponse.json({success:true,message:"MySQL connected successfully"})}catch(error){console.error("MySQL connection test failed",error);return NextResponse.json({success:false,message:"Database connection failed"},{status:503})}}
