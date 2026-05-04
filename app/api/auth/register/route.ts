/**
 * app/api/auth/register/route.ts
 * POST — create a new user account with email + password.
 * Called by the sign-up page before signing in via NextAuth credentials.
 */
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email || typeof body.email !== "string") {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }
  if (!body.password || typeof body.password !== "string") {
    return Response.json({ error: "Password is required." }, { status: 400 });
  }
  if (body.password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existing) {
    return Response.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name && typeof body.name === "string" ? body.name : null,
      password: hashedPassword,
    },
  });

  return Response.json(
    { data: { id: user.id, email: user.email, name: user.name } },
    { status: 201 }
  );
}
