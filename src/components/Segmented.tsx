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
    <div className="flex rounded-lg bg-white/10 p-0.5 text-xs">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
            value === val ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-gray-300 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
