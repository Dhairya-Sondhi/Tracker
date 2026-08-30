import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/users";
import { getAdminOverview } from "@/lib/admin/users";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
  const admin=await requireRole("ADMIN");
  if(!admin)return NextResponse.json({message:"Forbidden"},{status:403});
  try{return NextResponse.json(await getAdminOverview(),{headers:{"Cache-Control":"no-store"}})}
  catch(error){console.error("Admin overview failed",error);return NextResponse.json({message:"Unable to load administration data."},{status:503})}
}
