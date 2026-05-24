import Link from "next/link";
import { Plus, Building2, Users, Car, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { OrgSubtitle } from "@/components/dashboard/OrgSubtitle";
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
        include: { _count: { select: { members: true, vehicles: true } } },
        orderBy: { createdAt: "asc" },
      })).map((o) => ({ org: o, role: "owner", counts: o._count }))
    : (await prisma.orgMember.findMany({
        where: { userId: dbUser.id },
        include: {
          org: { include: { _count: { select: { members: true, vehicles: true } } } },
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground leading-none tracking-tight">
            <PageTitle k="organisations" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <OrgSubtitle count={memberships.length} />
          </p>
        </div>
        <Button
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold active:scale-[0.98] transition-transform"
          render={<Link href="/dashboard/orgs/new" />}
        >
          <Plus className="h-4 w-4" />
          <PageTitle k="newOrg" />
        </Button>
      </div>

      {memberships.length === 0 ? (
        <div className="border border-border/50 rounded-xl overflow-hidden">
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 border border-border/40 flex items-center justify-center mb-5">
              <Building2 className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No organisations yet</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-[36ch]">
              Create an organisation to group your fleet and invite your team.
            </p>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform"
              render={<Link href="/dashboard/orgs/new" />}
            >
              Create your first org
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-border/50 rounded-xl overflow-hidden divide-y divide-border/40">
          {memberships.map(({ org, role, counts }) => (
            <Link
              key={org.id}
              href={`/dashboard/orgs/${org.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors duration-150 group"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/8 border border-primary/12 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-primary/70" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-none mb-1.5">
                  {org.name}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {counts.members} member{counts.members !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {counts.vehicles} vehicle{counts.vehicles !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <Badge className={`text-xs capitalize border shrink-0 ${roleColor(role)}`}>
                {role}
              </Badge>

              <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
