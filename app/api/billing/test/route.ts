/**
 * GET /api/billing/test
 * Dev-only: calls Billplz API with real credentials and returns the raw
 * response so we can see exactly what error is being thrown.
 * Remove this route before going to production.
 */
import { NextResponse } from "next/server";

export async function GET() {
  const key          = process.env.BILLPLZ_API_KEY;
  const collectionId = process.env.BILLPLZ_COLLECTION_ID;
  const sandbox      = process.env.BILLPLZ_SANDBOX === "true";
  const base         = sandbox ? "https://www.billplz-sandbox.com" : "https://www.billplz.com";

  if (!key || !collectionId) {
    return NextResponse.json({ error: "Missing BILLPLZ_API_KEY or BILLPLZ_COLLECTION_ID in .env" });
  }

  const credentials = Buffer.from(`${key}:`).toString("base64");

  const body = new URLSearchParams({
    collection_id: collectionId,
    email:         "test@miraefleet.app",
    name:          "Test User",
    amount:        "2900",
    description:   "Mirae Personal Plan — Monthly",
    callback_url:  "https://miraefleet.app/api/billing/billplz",
    redirect_url:  "https://miraefleet.app/welcome?plan=personal",
    reference_1:   "test-org-id",
    reference_2:   "personal",
  });

  let status: number;
  let responseBody: unknown;

  try {
    const res = await fetch(`${base}/api/v3/bills`, {
      method: "POST",
      headers: {
        Authorization:  `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    status = res.status;
    const text = await res.text();
    try { responseBody = JSON.parse(text); } catch { responseBody = text; }
  } catch (err: unknown) {
    return NextResponse.json({
      error: "fetch threw — Billplz API unreachable",
      detail: String(err),
      config: { base, sandbox, key: key.slice(0, 4) + "…", collectionId },
    });
  }

  return NextResponse.json({
    httpStatus: status,
    response:   responseBody,
    config:     { base, sandbox, key: key.slice(0, 4) + "…", collectionId },
  });
}
