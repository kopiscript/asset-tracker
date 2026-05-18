/** Derives a vehicle's status from isActive flag and last telemetry timestamp. */
export function deriveStatus(isActive: boolean | null, lastSeenAt: Date | null): string {
  if (!isActive) return "offline";
  if (!lastSeenAt) return "idle";
  const minAgo = (Date.now() - lastSeenAt.getTime()) / 60000;
  return minAgo < 10 ? "active" : minAgo < 60 ? "idle" : "offline";
}
