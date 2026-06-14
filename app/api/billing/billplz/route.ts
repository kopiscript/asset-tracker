/**
 * POST — Billplz payment callback (webhook).
 *
 * Billplz sends a form-encoded POST to this URL on every bill state change.
 * We verify the X-Signature HMAC, then activate or lapse the org's plan.
 * The plan key is read from reference_2 (set when creating the bill).
 *
 * Env vars required:
 *   BILLPLZ_WEBHOOK_SECRET  — X-Signature Key from Billplz settings
 *
 * Billplz retries on any non-200 response, so always return 200 once auth passes.
 */
import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const GRACE_DAYS = 7;
const PLAN_DAYS = 31;
const VALID_PLANS = new Set(["personal", "growth", "fleet", "enterprise"]);

function verifySignature(params: URLSearchParams, secret: string, signature: string): boolean {
  const keys = [...params.keys()]
    .filter((k) => k !== "x_signature")
    .sort();
  const payload = keys.map((k) => `${k}|${params.get(k)}`).join("|");
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  // Constant-time compare to avoid leaking the signature via timing.
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

export async function POST(request: NextRequest) {
  const secret = process.env.BILLPLZ_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[billplz webhook] BILLPLZ_WEBHOOK_SECRET not set");
    return new Response("misconfigured", { status: 500 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const params = new URLSearchParams(body);
  const signature = params.get("x_signature") ?? "";

  if (!verifySignature(params, secret, signature)) {
    return new Response("unauthorized", { status: 401 });
  }

  const billId = params.get("id") ?? "";
  const paid = params.get("paid") === "true";
  const orgId = params.get("reference_1") ?? "";
  const planRaw = params.get("reference_2") ?? "";
  const plan = VALID_PLANS.has(planRaw) ? planRaw : "personal";

  if (!orgId) {
    console.warn("[billplz webhook] no orgId in reference_1, billId:", billId);
    return new Response("ok", { status: 200 });
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    console.warn("[billplz webhook] org not found:", orgId);
    return new Response("ok", { status: 200 });
  }

  const now = new Date();

  if (paid) {
    const planExpiresAt = new Date(now.getTime() + PLAN_DAYS * 24 * 60 * 60 * 1000);

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        plan,
        planExpiresAt,
        gracePeriodEndsAt: null,
        billplzSubId: billId,
      },
    });

    console.log(`[billplz webhook] org ${orgId} → plan "${plan}" until ${planExpiresAt.toISOString()}`);
  } else {
    const gracePeriodEndsAt = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);

    await prisma.organization.update({
      where: { id: orgId },
      data: { gracePeriodEndsAt },
    });

    console.log(`[billplz webhook] org ${orgId} payment lapsed, grace until ${gracePeriodEndsAt.toISOString()}`);
  }

  return new Response("ok", { status: 200 });
}
