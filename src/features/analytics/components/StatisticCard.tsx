interface StatisticCardProps {
  label: string
  value: string
  hint?: string
}

/** Single metric tile — label + value; no calculation. */
export function StatisticCard({ label, value, hint }: StatisticCardProps) {
  return (
    <div className="rounded-lg border border-stone-700/40 bg-stone-950/50 px-3 py-2.5">
      <p className="text-xs text-stone-400">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-stone-100">{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-stone-500">{hint}</p>}
    </div>
  )
}
