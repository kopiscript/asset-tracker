import { prisma } from "@/lib/prisma";

// POST /api/cron/retention
// Called by an external cron service (e.g. cron-job.org) on a daily schedule.
// Auth: Authorization: Bearer <CRON_SECRET>
//
// Deletes telemetry_records rows older than RETENTION_MONTHS (default 6).
// Capped at 50 000 rows per call to avoid Neon HTTP timeouts on large backlogs;
// the cron simply calls again the next cycle until caught up.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const retentionMonths = parseInt(process.env.RETENTION_MONTHS ?? "6", 10);
  if (isNaN(retentionMonths) || retentionMonths < 1 || retentionMonths > 120) {
    return Response.json(
      { data: null, error: "RETENTION_MONTHS must be an integer between 1 and 120" },
      { status: 500 }
    );
  }

  // $executeRawUnsafe required — deleteMany fails with PrismaNeonHttp (no transaction support).
  // retentionMonths is validated above; no user input reaches this string.
  const deleted = await prisma.$executeRawUnsafe(`
    WITH to_delete AS (
      SELECT id FROM telemetry_records
      WHERE timestamp_utc < NOW() - INTERVAL '${retentionMonths} months'
      LIMIT 50000
    )
    DELETE FROM telemetry_records
    WHERE id IN (SELECT id FROM to_delete)
  `);

  return Response.json({
    data: { deleted, retentionMonths },
    error: null,
  });
}
