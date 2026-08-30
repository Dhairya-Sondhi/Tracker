import type { Metadata } from "next";
import { AnalyticsScreen } from "@/components/dashboard/analytics-screen";
export const metadata:Metadata={title:"Dashboard — Form",description:"The big picture of your personal progress."};
export default function DashboardPage(){return <AnalyticsScreen/>}
