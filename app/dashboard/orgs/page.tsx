import Link from "next/link";
import { Plus, Building2, Users, Car, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";

export default async function OrgsPage() {
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in.</p>
      </div>
    );
  }

  const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";

  const memberships = isAdmin
    ? (await prisma.organization.findMany({
        include: { _count: { select: { members: true, vehicles: true, fleets: true } } },
        orderBy: { createdAt: "asc" },
      })).map((o) => ({ org: o, role: "owner", counts: o._count }))
    : (await prisma.orgMember.findMany({
        where: { userId: dbUser.id },
        include: {
          org: { include: { _count: { select: { members: true, vehicles: true, fleets: true } } } },
        },
        orderBy: { createdAt: "asc" },
      })).map((m) => ({ org: m.org, role: m.role, counts: m.org._count }));

  const roleColor = (role: string) =>
    role === "owner"
      ? "bg-primary/10 text-primary border-primary/20"
      : role === "admin"
      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organisations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {memberships.length} organisation{memberships.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          render={<Link href="/dashboard/orgs/new" />}
        >
          <Plus className="h-4 w-4" />
          New Org
        </Button>
      </div>

      {memberships.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">You are not in any organisation yet.</p>
          <Button
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            render={<Link href="/dashboard/orgs/new" />}
          >
            Create your first org
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map(({ org, role, counts }) => (
            <Link
              key={org.id}
              href={`/dashboard/orgs/${org.id}`}
              className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <Badge className={`text-xs capitalize border ${roleColor(role)}`}>
                  {role}
                </Badge>
              </div>
              <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {org.name}
              </h2>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {counts.members} member{counts.members !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" />
                  {counts.vehicles} vehicle{counts.vehicles !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {counts.fleets} fleet{counts.fleets !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
