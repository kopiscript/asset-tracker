import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Car, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { getOrgRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { OrgPageClient } from "./OrgPageClient";
import { RemoveMemberButton } from "./RemoveMemberButton";

export default async function OrgDetailPage(
  props: PageProps<"/dashboard/orgs/[id]">
) {
  const { id } = await props.params;

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return notFound();

  const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
  const userRole = isAdmin ? "owner" : await getOrgRole(dbUser.id, id);
  if (!userRole) return notFound();

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      vehicles: {
        select: { id: true, name: true, plateNumber: true, type: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!org) return notFound();

  const canManage = userRole === "owner";

  const roleColor = (role: string) =>
    role === "owner"
      ? "bg-primary/10 text-primary border-primary/20"
      : role === "admin"
      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/dashboard/orgs" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">Your role: {userRole}</p>
        </div>
      </div>

      {/* ── Members ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" /> Members ({org.members.length})
          </h2>
          {canManage && (
            <OrgPageClient orgId={id} />
          )}
        </div>
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          {org.members.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 px-4 py-3 ${i < org.members.length - 1 ? "border-b border-border/30" : ""}`}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {(m.user.name ?? m.user.email)[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {m.user.name}
                  {m.userId === dbUser.id && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
              </div>
              <Badge className={`text-xs capitalize border ${roleColor(m.role)}`}>{m.role}</Badge>
              {canManage && m.userId !== dbUser.id && (
                <RemoveMemberButton
                  orgId={id}
                  userId={m.userId}
                  userName={m.user.name ?? m.user.email}
                />
              )}
            </div>
          ))}
          {org.members.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No members yet.</div>
          )}
        </div>
      </div>

      {/* ── Vehicles ───────────────────────────────────────────────────── */}
      {org.vehicles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Car className="h-4 w-4" /> Vehicles ({org.vehicles.length})
          </h2>
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            {org.vehicles.map((v, i) => (
              <div
                key={v.id.toString()}
                className={`flex items-center gap-3 px-4 py-3 ${i < org.vehicles.length - 1 ? "border-b border-border/30" : ""}`}
              >
                <Link
                  href={`/dashboard/vehicles/${v.id.toString()}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {v.name ?? v.id.toString()}
                </Link>
                {v.plateNumber && (
                  <span className="font-mono text-xs text-muted-foreground">{v.plateNumber}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
