// Per-vehicle sharing is not supported. Vehicles are accessed via org membership.
export async function GET() {
  return Response.json(
    { data: null, error: "Per-vehicle sharing is not supported." },
    { status: 410 }
  );
}
export async function POST() {
  return Response.json(
    { data: null, error: "Per-vehicle sharing is not supported." },
    { status: 410 }
  );
}
