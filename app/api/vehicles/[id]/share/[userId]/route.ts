// Per-vehicle sharing removed. Use /api/orgs/[id]/fleets/[fleetId]/members instead.
export async function DELETE() {
  return Response.json(
    { data: null, error: "Per-vehicle sharing is removed. Use fleet management instead." },
    { status: 410 }
  );
}
