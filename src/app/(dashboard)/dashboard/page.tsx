import { redirect } from "next/navigation";

import { requireUser } from "@/lib/authorization";
import { getRoleHomePath } from "@/types/auth";

export default async function DashboardPage() {
  const user = await requireUser();
  redirect(getRoleHomePath(user.role));
}
