import Image from 'next/image'

interface ToggleGroupProps {
  items: { key: string; label: string; icon?: string; color?: string }[]
  value: string
  onChange: (v: string) => void
  size?: 'sm' | 'md'
}

export function ToggleGroup({ items, value, onChange, size = 'sm' }: ToggleGroupProps) {
  return (
    <div className="flex items-center gap-0.5 bg-[#F2F2F2] rounded-full p-0.5">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`${size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} font-medium rounded-full transition-all flex items-center gap-1.5 ${
            value === item.key
              ? 'bg-white text-[#0E0F0F] shadow-sm'
              : 'text-[#9EB3A8] hover:text-[#0E0F0F]'
          }`}
        >
          {item.color && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.icon && !item.color && (
            <Image
              src={item.icon}
              alt=""
              width={size === 'md' ? 14 : 12}
              height={size === 'md' ? 14 : 12}
              className="rounded-full"
            />
          )}
          {item.label}
        </button>
      ))}
    </div>
  )
}
