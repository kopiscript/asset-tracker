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
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" render={<Link href="/dashboard/orgs" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight leading-none">
            New Organisation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a workspace to group your fleet.
          </p>
        </div>
      </div>

      <div className="max-w-md border border-border/50 rounded-xl overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Organisation name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Perodua KL Showroom"
                required
                autoFocus
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                You&apos;ll be added as the owner and can invite team members later.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/8 border border-destructive/15 px-3 py-2.5 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold active:scale-[0.98] transition-transform"
              >
                {loading ? "Creating…" : "Create Organisation"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="active:scale-[0.98] transition-transform"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
