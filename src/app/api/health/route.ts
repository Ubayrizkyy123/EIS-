import { NextResponse } from "next/server";

import { healthService } from "@/server/composition";

export async function GET() {
  try {
    await healthService.check();

    return NextResponse.json({
      status: "ok",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        database: "down",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
