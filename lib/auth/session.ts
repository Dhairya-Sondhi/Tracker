import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function destroySession(){
 const supabase=await createSupabaseServerClient();
 const {error}=await supabase.auth.signOut();
 if(error)throw error;
}
