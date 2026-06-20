import { integrationReadiness } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    status: "ok",
    service: "gigling-tactics",
    timestamp: new Date().toISOString(),
    integrations: integrationReadiness,
  });
}
