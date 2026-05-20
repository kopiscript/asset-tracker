"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewOrgPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json().catch(() => null) as { data?: { id: string }; error?: string } | null;
    setLoading(false);

    if (!res.ok || !json?.data) {
      setError(json?.error ?? "Failed to create organisation.");
      return;
    }

    router.push(`/dashboard/orgs/${json.data.id}`);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" render={<Link href="/dashboard/orgs" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">New Organisation</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Organisation name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Perodua KL Showroom"
            required
            autoFocus
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-500/10 rounded px-3 py-2">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          {loading ? "Creating…" : "Create Organisation"}
        </Button>
      </form>
    </div>
  );
}
