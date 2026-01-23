import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

const emojiCategories = {
  money: {
    label: "💰",
    emojis: ["💰", "💵", "💴", "💶", "💷", "💳", "💎", "🪙", "🏦", "🏧", "💸", "📈", "📉", "🧾", "💹"],
  },
  shopping: {
    label: "🛒",
    emojis: ["🛒", "🛍️", "🏪", "🏬", "🛵", "🚗", "⛽", "🎁", "📦", "🏠", "🔑", "🪴", "🛋️", "🛏️", "🚿"],
  },
  food: {
    label: "🍔",
    emojis: ["🍔", "🍕", "🍜", "🍱", "🍣", "🍙", "🍚", "🍛", "☕", "🧋", "🍺", "🍷", "🥤", "🍰", "🍩"],
  },
  transport: {
    label: "🚗",
    emojis: ["🚗", "🚕", "🚌", "🚇", "🚄", "✈️", "🛵", "🚲", "🛴", "⛽", "🅿️", "🚦", "🛤️", "🚢", "🚁"],
  },
  entertainment: {
    label: "🎮",
    emojis: ["🎮", "🎬", "🎵", "🎤", "📺", "📱", "💻", "🎯", "🎲", "🎰", "🎭", "🎪", "🎨", "📸", "🎸"],
  },
  health: {
    label: "💊",
    emojis: ["💊", "🏥", "💉", "🩺", "🩹", "🏃", "🧘", "💪", "🧠", "❤️", "🦷", "👓", "🩻", "🚑", "⚕️"],
  },
  education: {
    label: "📚",
    emojis: ["📚", "📖", "✏️", "🎓", "🏫", "📝", "📐", "🔬", "🔭", "🧪", "💡", "🗂️", "📁", "🖥️", "⌨️"],
  },
  travel: {
    label: "✈️",
    emojis: ["✈️", "🏨", "🗺️", "🧳", "🏖️", "⛰️", "🏕️", "🗼", "🗽", "🎢", "🏰", "⛩️", "🕌", "🌏", "🌅"],
  },
  people: {
    label: "👤",
    emojis: ["👤", "👨", "👩", "👶", "👴", "👵", "👨‍👩‍👧", "💑", "👥", "🤝", "💼", "👔", "👗", "👟", "🎒"],
  },
  nature: {
    label: "🌿",
    emojis: ["🌿", "🌸", "🌺", "🌻", "🌲", "🌳", "🍀", "🐶", "🐱", "🐰", "🐦", "🦋", "🐠", "🌈", "☀️"],
  },
  objects: {
    label: "📦",
    emojis: ["📦", "📫", "📞", "⏰", "🔔", "🔒", "🔑", "🔧", "🔨", "💡", "🔋", "📡", "🎀", "🏆", "🎖️"],
  },
  symbols: {
    label: "⭐",
    emojis: ["⭐", "❤️", "💚", "💙", "💜", "🧡", "💛", "🤍", "🖤", "✅", "❌", "⚠️", "❓", "💯", "🔥"],
  },
}

interface EmojiPickerProps {
  value?: string
  onChange: (emoji: string) => void
  className?: string
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<keyof typeof emojiCategories>("money")
  const containerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 text-2xl hover:bg-accent"
      >
        {value || "😀"}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border bg-background shadow-lg">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1 border-b p-2">
            {Object.entries(emojiCategories).map(([key, category]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key as keyof typeof emojiCategories)}
                className={cn(
                  "rounded p-1.5 text-lg hover:bg-accent",
                  activeCategory === key && "bg-accent"
                )}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto p-2">
            {emojiCategories[activeCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji)
                  setIsOpen(false)
                }}
                className={cn(
                  "rounded p-1.5 text-xl hover:bg-accent",
                  value === emoji && "bg-primary/20"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
