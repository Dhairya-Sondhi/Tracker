import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import { enforceRateLimits,RateLimitExceededError,requestAddress } from "@/lib/auth/rate-limit";
import { emailSchema } from "@/lib/auth/validation";
import { z } from "zod";

const schema=z.object({email:emailSchema});export const runtime="nodejs";
export async function POST(request:Request){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Enter a valid email address."},{status:400});try{const email=parsed.data.email,ip=requestAddress(request);await enforceRateLimits([{scope:"forgot-email",subject:email,limit:3,windowSeconds:3600,blockSeconds:3600},{scope:"forgot-ip",subject:ip,limit:20,windowSeconds:3600,blockSeconds:3600}]);const developmentLink=await requestPasswordReset(email);return NextResponse.json({success:true,message:"If an account exists, a password reset link has been sent.",developmentLink})}catch(error){if(error instanceof RateLimitExceededError)return NextResponse.json({message:"Too many reset requests. Try again later."},{status:429,headers:{"Retry-After":String(error.retryAfter)}});console.error("Password reset request failed",error);return NextResponse.json({message:"We couldn't process that request right now."},{status:503})}}
