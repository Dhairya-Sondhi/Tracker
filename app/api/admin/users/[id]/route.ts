import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/users";
import { updateManagedUser } from "@/lib/admin/users";

const updateSchema=z.object({role:z.enum(["ADMIN","USER"]).optional(),isActive:z.boolean().optional()}).refine(value=>value.role!==undefined||value.isActive!==undefined);
export const runtime="nodejs";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const admin=await requireRole("ADMIN");if(!admin)return NextResponse.json({message:"Forbidden"},{status:403});
  const targetId=Number((await params).id);const parsed=updateSchema.safeParse(await request.json().catch(()=>null));
  if(!Number.isSafeInteger(targetId)||targetId<1||!parsed.success)return NextResponse.json({message:"Invalid request."},{status:400});
  try{return NextResponse.json({user:await updateManagedUser({actorId:admin.id,targetId,...parsed.data})})}
  catch(error){const code=error instanceof Error?error.message:"";if(code==="USER_NOT_FOUND")return NextResponse.json({message:"User not found."},{status:404});if(code==="SELF_MANAGEMENT_NOT_ALLOWED")return NextResponse.json({message:"You cannot change your own access here."},{status:409});if(code==="LAST_ADMIN")return NextResponse.json({message:"The last active administrator cannot be removed."},{status:409});console.error("Admin user update failed",error);return NextResponse.json({message:"Unable to update this user."},{status:503})}
}
