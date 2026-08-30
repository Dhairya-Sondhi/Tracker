import type { Metadata } from "next";
import { TodayScreen } from "@/components/dashboard/today-screen";

export const metadata: Metadata = { title: "Today — Form", description: "Log today in seconds." };

export default function TodayPage() { return <TodayScreen/>; }
