// Vehicle sharing has been replaced by org-level fleet management.
// Use /api/orgs/[id]/fleets/[fleetId]/members to grant access to vehicles.
export async function GET() {
  return Response.json(
    { data: null, error: "Per-vehicle sharing is removed. Use fleet management instead." },
    { status: 410 }
  );
}
export async function POST() {
  return Response.json(
    { data: null, error: "Per-vehicle sharing is removed. Use fleet management instead." },
    { status: 410 }
  );
}
