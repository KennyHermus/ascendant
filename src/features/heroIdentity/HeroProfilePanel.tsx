import { Panel } from '@/components/Panel'
import { ProgressBar } from '@/components/ProgressBar'
import { XpBar } from '@/components/XpBar'
import {
  formatHeroTitleDisplay,
  formatPercentDisplay,
} from '@/features/heroIdentity/heroIdentityPresentation'
import type { HeroProfileViewModel } from '@/types/heroIdentity'

interface HeroProfilePanelProps {
  profile: HeroProfileViewModel
}

function ProfileStat({
  label,
  value,
  hint,
  valueClassName = 'text-amber-100',
}: {
  label: string
  value: string
  hint?: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-lg border border-stone-800/60 bg-stone-950/50 px-3 py-2.5">
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className={`mt-0.5 text-lg font-semibold ${valueClassName}`}>{value}</dd>
      {hint && <p className="mt-0.5 text-[11px] text-stone-500">{hint}</p>}
    </div>
  )
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">
      {children}
    </h3>
  )
}

/**
 * Expanded Hero profile — identity, biography, accomplishments, and lifetime
 * journey metrics. Presentation-only; all values come from selectors.
 */
export function HeroProfilePanel({ profile }: HeroProfilePanelProps) {
  const accomplishmentCount = profile.unlockedAccomplishments.length
  const titleCount = profile.unlockedTitles.length

  return (
    <Panel className="border-amber-900/25 bg-stone-900/70">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-amber-700/50 bg-gradient-to-br from-amber-900/60 to-stone-900 text-2xl font-semibold text-amber-200 shadow-inner shadow-black/20"
          title="Portrait placeholder"
        >
          {profile.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-amber-500/80">
            {formatHeroTitleDisplay(profile.heroTitle)}
          </p>
          <h2 className="truncate text-2xl font-semibold text-amber-50">{profile.name}</h2>
          <p className="mt-0.5 text-sm text-stone-300">
            {profile.currentRank}
            <span className="text-stone-500"> · </span>
            Level {profile.level}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <XpBar
          current={profile.currentXp}
          required={profile.xpRequired}
          percent={profile.xpPercent}
          level={profile.level}
        />
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <SectionHeading>Journey</SectionHeading>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ProfileStat label="Lifetime Gold" value={String(profile.lifetimeGold)} />
            <ProfileStat label="Days Active" value={String(profile.daysActive)} />
            <ProfileStat
              label="Current Streak"
              value={`${profile.currentStreak} ${profile.currentStreak === 1 ? 'day' : 'days'}`}
              valueClassName="text-emerald-300"
            />
            <ProfileStat
              label="Longest Streak"
              value={`${profile.longestStreak} ${profile.longestStreak === 1 ? 'day' : 'days'}`}
              valueClassName="text-emerald-300"
            />
          </div>
        </div>

        <div>
          <SectionHeading>Consistency</SectionHeading>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ProfileStat
              label="Overall Completion"
              value={formatPercentDisplay(profile.overallCompletionPercent)}
              hint="Last 365 days"
            />
            <ProfileStat
              label="Overall Training"
              value={formatPercentDisplay(profile.overallTrainingPercent)}
              hint="Workout quest · last 365 days"
            />
            <ProfileStat
              label="Overall Nutrition"
              value={formatPercentDisplay(profile.overallNutritionPercent)}
              hint="Nutrition quests · last 365 days"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-stone-800/60 pt-4">
        <SectionHeading>Biography</SectionHeading>
        <div className="mt-2 rounded-lg border border-stone-800/50 bg-stone-950/40 px-3 py-3">
          <p className="space-y-2 text-sm leading-relaxed text-stone-300">
            {profile.biographyLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-stone-800/60 pt-4">
        <SectionHeading>Hero Titles</SectionHeading>
        {titleCount > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {profile.unlockedTitles.map((title) => (
              <li
                key={title.id}
                className={`rounded-full border px-3 py-1 text-xs ${
                  title.name === profile.heroTitle
                    ? 'border-amber-600/60 bg-amber-950/40 text-amber-200'
                    : 'border-stone-700/50 bg-stone-950/40 text-stone-400'
                }`}
                title={title.description}
              >
                {title.name}
                {title.name === profile.heroTitle && (
                  <span className="ml-1 text-[10px] uppercase tracking-wide text-amber-500/80">
                    Active
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            No titles earned yet — reach lifetime milestones to unlock your first title.
          </p>
        )}
      </div>

      <div className="mt-5 border-t border-stone-800/60 pt-4">
        <SectionHeading>Lifetime Accomplishments</SectionHeading>
        {accomplishmentCount > 0 ? (
          <ul className="mt-2 space-y-2">
            {profile.unlockedAccomplishments.map((accomplishment) => (
              <li
                key={accomplishment.id}
                className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-3 py-2"
              >
                <p className="text-sm font-medium text-emerald-200">{accomplishment.name}</p>
                <p className="text-xs text-stone-500">{accomplishment.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            Major milestones will appear here as the Hero&apos;s legacy grows.
          </p>
        )}
      </div>

      {profile.nextAccomplishments.length > 0 && (
        <div className="mt-5 border-t border-stone-800/60 pt-4">
          <SectionHeading>Next Milestones</SectionHeading>
          <ul className="mt-2 space-y-3">
            {profile.nextAccomplishments.map(({ definition, progress, target }) => (
              <li key={definition.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="text-stone-300">{definition.name}</span>
                  <span className="shrink-0 text-xs text-stone-500">
                    {progress} / {target}
                  </span>
                </div>
                <ProgressBar completed={progress} total={target} color="emerald" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
