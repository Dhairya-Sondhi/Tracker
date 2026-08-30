import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/users";
export const runtime="nodejs";
export async function GET(){try{const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});return NextResponse.json({id:user.id,email:user.email,displayName:user.displayName,role:user.role})}catch(error){console.error("Current user lookup failed",error);return NextResponse.json({message:"We couldn't load your account."},{status:503})}}
