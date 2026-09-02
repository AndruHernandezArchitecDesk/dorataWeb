import { useEffect, useState } from "react";
import { Trash2, Image as ImageIcon, ExternalLink } from "lucide-react";
import { getBanners, createBanner, deleteBanner } from "../../lib/api";

export default function PublicidadAdmin() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await getBanners(true);
      setBanners(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!image.trim()) return alert("Ingresa URL de imagen");
    try {
      new URL(image);
    } catch {
      return alert("URL no válida");
    }
    setSaving(true);
    try {
      await createBanner({ image: image.trim(), title: title.trim() || null });
      setImage("");
      setTitle("");
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Eliminar banner?")) return;
    try {
      await deleteBanner(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-paper border border-line rounded-3xl p-5">
        <div className="text-sm font-bold text-charcoal mb-3">Nuevo banner (URL)</div>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] label-font text-charcoal flex items-center gap-1">
              <ImageIcon size={10} /> URL de imagen
            </label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://ejemplo.com/banner.jpg"
              required
              className="rounded-xl bg-cream border border-line px-3 py-2.5 text-sm text-charcoal outline-none focus:border-flame"
            />
            {image && (
              <div className="mt-1 rounded-xl overflow-hidden border border-line bg-cream h-32 flex items-center justify-center">
                <img src={image} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.target.style.display = "none")} />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] label-font text-charcoal">Título (opcional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Promo 2x1"
              className="rounded-xl bg-cream border border-line px-3 py-2.5 text-sm text-charcoal outline-none focus:border-flame"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl py-3 bg-flame text-cream font-extrabold text-sm disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Agregar banner"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-sm text-mute">Cargando banners...</div>
      ) : banners.length === 0 ? (
        <div className="text-sm text-mute bg-paper border border-line rounded-2xl p-4 text-center">Sin banners. Agrega uno por URL.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {banners.map((b) => (
            <div key={b.id} className="bg-paper border border-line rounded-2xl overflow-hidden flex flex-col">
              <div className="aspect-[21/9] bg-cream overflow-hidden">
                <img src={b.image} alt={b.title || "banner"} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-charcoal truncate">{b.title || "Sin título"}</div>
                  <div className="text-[11px] text-mute truncate flex items-center gap-1">
                    <ExternalLink size={10} /> {b.image}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="w-8 h-8 rounded-full bg-cream border border-line flex items-center justify-center"
                >
                  <Trash2 size={14} className="text-mute" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
