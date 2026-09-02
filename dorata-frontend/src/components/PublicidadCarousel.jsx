import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PublicidadCarousel() {
  const [banners, setBanners] = useState([]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch("/api/banners?branchId=branch-main")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setBanners(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 3500);
    return () => clearInterval(t);
  }, [banners.length, paused]);

  if (banners.length === 0) return null;

  const go = (d) => setIdx((i) => (i + d + banners.length) % banners.length);

  return (
    <div
      className="max-w-6xl mx-auto px-5 mt-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl bg-paper border border-line aspect-[21/9] md:aspect-[3/1]">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-500 ${i === idx ? "opacity-100" : "opacity-0"}`}
          >
            {b.link ? (
              <a href={b.link} target="_blank" rel="noreferrer" className="block w-full h-full">
                <img src={b.image} alt={b.title || "Publicidad"} className="w-full h-full object-cover" />
              </a>
            ) : (
              <img src={b.image} alt={b.title || "Publicidad"} className="w-full h-full object-cover" />
            )}
            {b.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-charcoal/60 px-4 py-2">
                <span className="text-sm font-bold text-cream">{b.title}</span>
              </div>
            )}
          </div>
        ))}

        {banners.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-charcoal/60 text-cream flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-charcoal/60 text-cream flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-2 h-2 rounded-full ${i === idx ? "bg-cream" : "bg-cream/40"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
