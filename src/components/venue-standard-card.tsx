import { AlertTriangle, BadgeCheck, ExternalLink } from "lucide-react";
import type { ResolvedVenueProfile } from "@/lib/venues";

export function VenueStandardCard({
  profile,
}: {
  profile: ResolvedVenueProfile;
}) {
  const StatusIcon = profile.profileVerified ? BadgeCheck : AlertTriangle;
  return (
    <section className="border border-rule rounded-lg bg-paper p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={
              profile.profileVerified
                ? "h-5 w-5 text-[var(--severity-low)]"
                : "h-5 w-5 text-[var(--severity-medium)]"
            }
          />
          <h2 className="font-serif text-xl">Venue standard applied</h2>
        </div>
        <span className="text-xs uppercase tracking-wide text-muted">
          {profile.profileVerified ? "Verified profile" : "Unverified profile"}
        </span>
      </div>

      <p className="text-sm text-foreground/80">{profile.verificationNote}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profile.criteria.map((criterion) => (
          <article
            key={criterion.key}
            className="border border-rule rounded-md p-3 flex flex-col gap-1"
          >
            <h3 className="font-medium text-sm">{criterion.label}</h3>
            <p className="text-sm text-muted leading-relaxed">
              {criterion.guidance}
            </p>
          </article>
        ))}
      </div>

      {profile.officialSources.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {profile.officialSources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-accent-hi hover:underline inline-flex items-center gap-1"
            >
              {source.label}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
