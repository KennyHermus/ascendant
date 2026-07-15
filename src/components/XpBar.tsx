interface XpBarProps {
  current: number
  required: number
  percent: number
  level: number
}

export function XpBar({ current, required, percent, level }: XpBarProps) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-stone-400">
        <span>Level {level}</span>
        <span>
          {current} / {required} XP
        </span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full border border-amber-900/40 bg-stone-900"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={required}
        aria-label={`Experience progress to level ${level + 1}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
