import type { Metadata } from "next";

import { EarlyAccessLanding } from "@/components/EarlyAccessLanding";

export const metadata: Metadata = {
  title: "Helix Early Access",
  description:
    "Request early access to Helix, the AI co-pilot for designing resilient cloud architectures.",
};

export default function EarlyAccessPage() {
  return <EarlyAccessLanding />;
}


