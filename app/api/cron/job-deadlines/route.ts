import { NextRequest, NextResponse } from "next/server";
import { refreshJobDeadlines } from "@/lib/jobs/deadline-refresh";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await refreshJobDeadlines());
  } catch (error) {
    console.error("Deadline refresh failed", error);
    return NextResponse.json({ error: "Deadline refresh failed" }, { status: 500 });
  }
}
