import type { Metadata } from "next";
import { AnalyticsScreen } from "@/components/dashboard/analytics-screen";
export const metadata:Metadata={title:"Analytics — Vlocity",description:"Turn consistency into insight."};
export default function AnalyticsPage(){return <AnalyticsScreen/>}
