export default function CategoryChips({ categories, active, onSelect }) {
  return (
    <div className="sticky top-[69px] z-20 bg-cream">
      <div className="max-w-6xl mx-auto px-5 py-3 flex gap-2 overflow-x-auto">
        {categories.map((c) => {
          const isActive = c === active;
          return (
            <button
              key={c}
              onClick={() => onSelect(c)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-colors ${
                isActive
                  ? "bg-charcoal text-cream border-charcoal"
                  : "bg-paper text-ink border-line"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
