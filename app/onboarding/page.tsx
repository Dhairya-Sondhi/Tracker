import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
export const metadata:Metadata={title:"Make Vlocity yours",description:"Build a personal growth system around what matters to you."};
export default function OnboardingPage(){return <OnboardingFlow/>}
