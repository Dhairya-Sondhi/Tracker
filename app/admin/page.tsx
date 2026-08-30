import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/users";
import { getAdminOverview } from "@/lib/admin/users";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
export const dynamic="force-dynamic";
export default async function AdminPage(){const user=await requireRole("ADMIN");if(!user)redirect("/today");const overview=await getAdminOverview();return <AdminDashboard initial={overview} admin={{id:user.id,name:user.displayName||user.email,email:user.email}}/>}
