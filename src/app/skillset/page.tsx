import type { Metadata } from "next";

import { SkillsetDashboard } from "./_components/skillset-dashboard";

export const metadata: Metadata = {
  title: "Skillset Dashboard",
  description:
    "A modern monochrome dashboard for tracking revenue, community growth, and course purchases.",
};

export default function SkillsetPage() {
  return <SkillsetDashboard />;
}
