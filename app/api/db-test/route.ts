import { NextResponse } from "next/server";
import { checkSupabaseConnection } from "@/lib/supabase/server";
export const runtime="nodejs";
export async function GET(){if(process.env.NODE_ENV==="production")return NextResponse.json({success:false,message:"Not found"},{status:404});try{await checkSupabaseConnection();return NextResponse.json({success:true,message:"Supabase connected successfully"})}catch(error){console.error("Supabase connection test failed",error);return NextResponse.json({success:false,message:"Database connection failed"},{status:503})}}
