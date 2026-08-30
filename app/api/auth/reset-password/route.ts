import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/lib/auth/password-reset";
import { destroySession } from "@/lib/auth/session";
import { enforceRateLimits,RateLimitExceededError,requestAddress } from "@/lib/auth/rate-limit";

const schema=z.object({token:z.string().min(32).max(200),password:z.string().min(8).max(128)});export const runtime="nodejs";
export async function POST(request:Request){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Use a valid reset link and a password of at least 8 characters."},{status:400});try{await enforceRateLimits([{scope:"reset-token",subject:parsed.data.token,limit:5,windowSeconds:900,blockSeconds:900},{scope:"reset-ip",subject:requestAddress(request),limit:20,windowSeconds:900,blockSeconds:900}]);if(!await resetPassword(parsed.data.token,parsed.data.password))return NextResponse.json({message:"This reset link is invalid or has expired."},{status:400});await destroySession();return NextResponse.json({success:true,message:"Password updated. You can now sign in."})}catch(error){if(error instanceof RateLimitExceededError)return NextResponse.json({message:"Too many reset attempts. Try again later."},{status:429,headers:{"Retry-After":String(error.retryAfter)}});console.error("Password reset failed",error);return NextResponse.json({message:"We couldn't reset your password right now."},{status:503})}}
