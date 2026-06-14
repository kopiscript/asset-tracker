import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Car, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { getOrgRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { OrgPageClient } from "./OrgPageClient";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { RevokeInviteButton } from "./RevokeInviteButton";
import { ViewerAccessButton } from "./ViewerAccessButton";
import { ChangeRoleSelect } from "./ChangeRoleSelect";
import type { TranslationKey } from "@/lib/translations";

export default async function OrgDetailPage(
  props: PageProps<"/dashboard/orgs/[id]">
) {
  const { id } = await props.params;

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return notFound();

  const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
  const userRole = isAdmin ? "owner" : await getOrgRole(dbUser.id, id);
  if (!userRole) return notFound();

  const canManage = userRole === "owner";
  const canManageViewerAccess = userRole === "owner" || userRole === "admin";

  const [org, pendingInvites] = await Promise.all([
    prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            vehicleAccess: { select: { vehicleId: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        vehicles: {
          select: { id: true, name: true, plateNumber: true, type: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    canManage
      ? prisma.orgInvite.findMany({
          where: { orgId: id, acceptedAt: null, expiresAt: { gt: new Date() } },
          include: { inviter: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);
  if (!org) return notFound();

  const orgVehicles = org.vehicles.map((v) => ({
    id: v.id.toString(),
    name: v.name,
    plateNumber: v.plateNumber,
  }));

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
          <h1 className="text-xl font-semibold text-foreground leading-none tracking-tight">{org.name}</h1>
          <p className="text-sm text-muted-foreground mt-1"><PageTitle k="yourRole" />: <PageTitle k={userRole as TranslationKey} /></p>
        </div>
      </div>

      {/* ── Members ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" /> <PageTitle k="members" /> ({org.members.length})
          </h2>
          {canManage && (
            <OrgPageClient orgId={id} />
          )}
        </div>
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          {org.members.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 px-4 py-4 ${i < org.members.length - 1 ? "border-b border-border/30" : ""}`}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {(m.user.name ?? m.user.email)[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {m.user.name}
                  {m.userId === dbUser.id && <span className="ml-1.5 text-xs text-muted-foreground"><PageTitle k="you" /></span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
              </div>
              {canManage && m.userId !== dbUser.id ? (
                <ChangeRoleSelect orgId={id} userId={m.userId} currentRole={m.role} />
              ) : (
                <Badge className={`text-xs border ${roleColor(m.role)}`}><PageTitle k={m.role as TranslationKey} /></Badge>
              )}
              {canManageViewerAccess && m.role === "viewer" && (
                <ViewerAccessButton
                  orgId={id}
                  userId={m.userId}
                  memberName={m.user.name ?? m.user.email}
                  vehicles={orgVehicles}
                  currentVehicleIds={m.vehicleAccess.map((a) => a.vehicleId.toString())}
                />
              )}
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
            <div className="py-8 text-center text-sm text-muted-foreground"><PageTitle k="noMembers" /></div>
          )}
        </div>
      </div>

      {/* ── Pending Invites ────────────────────────────────────────────── */}
      {canManage && pendingInvites.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" /> <PageTitle k="pendingInvites" /> ({pendingInvites.length})
          </h2>
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            {pendingInvites.map((inv, i) => (
              <div
                key={inv.id}
                className={`flex items-center gap-3 px-4 py-4 ${i < pendingInvites.length - 1 ? "border-b border-border/30" : ""}`}
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {inv.email[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    <PageTitle k="expires" /> {inv.expiresAt.toLocaleDateString("en-MY", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <Badge className={`text-xs border ${roleColor(inv.role)}`}>
                  <PageTitle k={inv.role as TranslationKey} />
                </Badge>
                <RevokeInviteButton orgId={id} inviteId={inv.id} email={inv.email} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vehicles ───────────────────────────────────────────────────── */}
      {org.vehicles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Car className="h-4 w-4" /> <PageTitle k="vehicles" /> ({org.vehicles.length})
          </h2>
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            {org.vehicles.map((v, i) => (
              <div
                key={v.id.toString()}
                className={`flex items-center gap-3 px-4 py-4 ${i < org.vehicles.length - 1 ? "border-b border-border/30" : ""}`}
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
