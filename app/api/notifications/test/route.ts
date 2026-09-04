import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/users";
import { enforceRateLimits,RateLimitExceededError } from "@/lib/auth/rate-limit";
import { EmailConfigurationError } from "@/lib/email";
import { sendTestNotification } from "@/lib/notification-email";

export const runtime="nodejs";
export async function POST(){
 const user=await requireUser();if(!user)return NextResponse.json({message:"Unauthenticated"},{status:401});
 try{await enforceRateLimits([{scope:"notification-test",subject:String(user.id),limit:3,windowSeconds:3600,blockSeconds:3600}]);await sendTestNotification(user);return NextResponse.json({success:true,message:`Test email sent to ${user.email}.`})}
 catch(error){if(error instanceof RateLimitExceededError)return NextResponse.json({message:"You’ve sent enough test emails for now. Try again later."},{status:429,headers:{"Retry-After":String(error.retryAfter)}});if(error instanceof EmailConfigurationError)return NextResponse.json({message:"Email delivery has not been configured yet."},{status:503});console.error("Test notification failed",error);return NextResponse.json({message:"We couldn’t send the test email."},{status:503})}
}
