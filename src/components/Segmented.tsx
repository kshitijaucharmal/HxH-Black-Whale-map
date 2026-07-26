export default function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-white/15 bg-white/5 text-xs">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`px-3 py-1.5 font-medium transition-colors ${
            value === val
              ? 'bg-[var(--accent)] text-white'
              : 'text-gray-300 hover:bg-white/10'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
