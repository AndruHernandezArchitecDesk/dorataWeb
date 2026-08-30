import { money } from "../data/menu";

export default function ProductGrid({ products, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className="text-left bg-paper border border-line rounded-2xl p-3 flex flex-col gap-2.5 transition-transform hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="w-full aspect-square rounded-xl bg-cream flex items-center justify-center text-4xl relative">
            {p.emoji}
            {p.tag && (
              <span
                className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] label-font ${
                  p.tag === "Picante" ? "bg-chile text-cream" : "bg-yolk text-charcoal"
                }`}
              >
                {p.tag.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-charcoal">{p.name}</div>
            <div className="text-sm font-extrabold text-flame mt-0.5">{money(p.price)}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
