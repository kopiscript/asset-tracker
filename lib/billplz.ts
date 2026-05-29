const BASE = process.env.BILLPLZ_SANDBOX === "true"
  ? "https://www.billplz-sandbox.com"
  : "https://www.billplz.com";

interface BillParams {
  email: string;
  name: string;
  amountCents: number;
  description: string;
  callbackUrl: string;
  redirectUrl: string;
  reference1: string; // orgId
  reference2: string; // plan key
}

export async function createBill(params: BillParams): Promise<{ id: string; url: string }> {
  const key = process.env.BILLPLZ_API_KEY;
  const collectionId = process.env.BILLPLZ_COLLECTION_ID;
  if (!key || !collectionId) throw new Error("Billplz env vars not configured");

  const credentials = Buffer.from(`${key}:`).toString("base64");

  const body = new URLSearchParams({
    collection_id: collectionId,
    email: params.email,
    name: params.name,
    amount: String(params.amountCents),
    description: params.description,
    callback_url: params.callbackUrl,
    redirect_url: params.redirectUrl,
    reference_1: params.reference1,
    reference_2: params.reference2,
  });

  const res = await fetch(`${BASE}/api/v3/bills`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Billplz API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return { id: data.id, url: data.url };
}
