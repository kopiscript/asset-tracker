/**
 * app/api/billing/billplz/route.ts
 * POST — Billplz payment callback (webhook).
 *
 * Billplz sends a form-encoded POST to this URL on every bill state change.
 * We verify the X-Signature HMAC, then activate or lapse the org's plan.
 *
 * Env vars required:
 *   BILLPLZ_WEBHOOK_SECRET  — your Billplz collection's X-Signature key
 *
 * Billplz retries on any non-200 response, so always return 200 once auth passes.
 */
import type { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

const GRACE_DAYS = 7;
const PLAN_DAYS = 31;

function verifySignature(params: URLSearchParams, secret: string, signature: string): boolean {
  // Billplz signature: sorted keys (excluding x_signature), joined as "key|value", HMAC-SHA256
  const keys = [...params.keys()]
    .filter((k) => k !== "x_signature")
    .sort();
  const payload = keys.map((k) => `${k}|${params.get(k)}`).join("|");
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
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
  // Billplz puts your metadata in the reference_1 / reference_2 fields.
  // We store orgId in reference_1 when creating the bill.
  const orgId = params.get("reference_1") ?? "";

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
    // Determine the plan from the collection ID
    const collectionId = params.get("collection_id") ?? "";
    const plan = resolvePlan(collectionId);

    const planExpiresAt = new Date(now.getTime() + PLAN_DAYS * 24 * 60 * 60 * 1000);

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        plan,
        planExpiresAt,
        gracePeriodEndsAt: null, // clear any active grace period
        billplzSubId: collectionId || org.billplzSubId,
      },
    });

    console.log(`[billplz webhook] org ${orgId} activated on plan "${plan}" until ${planExpiresAt.toISOString()}`);
  } else {
    // Payment failed or bill expired — start grace period
    const gracePeriodEndsAt = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);

    await prisma.organization.update({
      where: { id: orgId },
      data: { gracePeriodEndsAt },
    });

    console.log(`[billplz webhook] org ${orgId} payment lapsed, grace until ${gracePeriodEndsAt.toISOString()}`);
  }

  return new Response("ok", { status: 200 });
}

function resolvePlan(collectionId: string): string {
  const map: Record<string, string> = {
    [process.env.BILLPLZ_COLLECTION_ID_PERSONAL ?? ""]: "personal",
    [process.env.BILLPLZ_COLLECTION_ID_GROWTH ?? ""]:   "growth",
    [process.env.BILLPLZ_COLLECTION_ID_FLEET ?? ""]:    "fleet",
  };
  return map[collectionId] ?? "personal";
}
