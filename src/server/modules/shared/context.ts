import type { Session } from "next-auth";

import type { AppRole } from "@/types/auth";

export type ServiceContext = {
  userId: string;
  role: AppRole;
};

export type ApiContext = ServiceContext & {
  session: Session;
};
