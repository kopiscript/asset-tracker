import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SharePage(
  props: PageProps<"/dashboard/vehicles/[id]/share">
) {
  const { id } = await props.params;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" render={<Link href={`/dashboard/vehicles/${id}`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Manage Access</h1>
      </div>

      <div className="max-w-md bg-card border border-border/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 text-primary">
          <Building2 className="h-6 w-6" />
          <p className="font-semibold text-foreground">Access is now managed via Organisations</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Per-vehicle sharing has been replaced by the org &amp; fleet model. To control who
          sees this vehicle, assign it to a fleet and grant users access through their
          organisation membership.
        </p>
        <div className="flex gap-2">
          <Button render={<Link href="/dashboard/orgs" />} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Go to Organisations
          </Button>
          <Button variant="outline" render={<Link href={`/dashboard/vehicles/${id}`} />}>
            Back to Vehicle
          </Button>
        </div>
      </div>
    </div>
  );
}
