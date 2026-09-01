import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requestPasswordReset(emailInput:string){
 const supabase=await createSupabaseServerClient();const base=(process.env.APP_URL||"http://localhost:3000").replace(/\/$/,"");
 const {error}=await supabase.auth.resetPasswordForEmail(emailInput.trim().toLowerCase(),{redirectTo:`${base}/api/auth/callback?next=/reset-password`});
 if(error)throw error;return null;
}
export async function resetPassword(password:string){
 const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return false;
 const {error}=await supabase.auth.updateUser({password});if(error)throw error;return true;
}
