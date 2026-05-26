/**
 * POST /api/vehicles/[id]/api-key
 * Generate (or rotate) the IoT API key for a vehicle.
 *
 * Returns the raw key ONCE in the response — it is not stored anywhere.
 * The DB stores only the bcrypt hash. Device owners must copy the key immediately.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canEdit } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function POST(
  _req: Request,
  ctx: RouteContext<"/api/vehicles/[id]/api-key">
) {
  const { id } = await ctx.params;

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "User not found" }, { status: 404 });
  }

  if (!(await canEdit(dbUser.id, id))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  const rawKey = randomBytes(32).toString("hex");
  const hash = await bcrypt.hash(rawKey, 10);

  try {
    await prisma.vehicle.update({
      where: { id: BigInt(id) },
      data: { apiKey: hash },
    });

    return Response.json(
      { data: { apiKey: rawKey }, error: null },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/vehicles/[id]/api-key]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
