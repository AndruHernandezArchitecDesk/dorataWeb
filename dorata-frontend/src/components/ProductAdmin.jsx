import { useEffect, useState } from "react";
import { Save, Trash2, Edit3, X, Plus, Image as ImageIcon } from "lucide-react";
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
} from "../lib/api";
import { money } from "../data/menu";

const BLANK = {
  name: "",
  categoryId: "",
  price: "",
  emoji: "",
  image: "",
  tag: "",
  hasExtras: false,
  hasSize: false,
  active: true,
  description: "",
};

export default function ProductAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState(null); // product id or null (create mode when form dirty & editing null)
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newCat, setNewCat] = useState("");

  const load = async () => {
    try {
      const [p, c] = await Promise.all([getProducts(), getCategories()]);
      setProducts(p);
      setCategories(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(BLANK);
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name || "",
      categoryId: p.categoryId || "",
      price: p.price ? Number(p.price) : "",
      emoji: p.emoji || "",
      image: p.image || "",
      tag: p.tag || "",
      hasExtras: p.hasExtras,
      hasSize: p.hasSize,
      active: p.active,
      description: p.description || "",
    });
  };

  const addCategory = async (e) => {
    e.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    try {
      await createCategory(name);
      setNewCat("");
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId || !form.price) {
      alert("Completá nombre, categoría y precio");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        price: Number(form.price),
        description: form.description.trim() || null,
        image: form.image.trim() || null,
        emoji: form.emoji.trim() || null,
        hasExtras: form.hasExtras,
        hasSize: form.hasSize,
        active: form.active,
        tag: form.tag.trim() || null,
      };
      if (editing) {
        await updateProduct(editing, payload);
      } else {
        await createProduct(payload);
      }
      setForm(BLANK);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async () => {
    setSaving(true);
    try {
      await deleteProduct(confirmDelete);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-display text-charcoal">Productos</div>
        </div>

        {/* Formulario */}
        <div className="bg-paper border border-line rounded-3xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-charcoal">
              {editing ? "Editar producto" : "Nuevo producto"}
            </span>
            {!editing && <span className="text-xs text-mute">(todo campos)</span>}
          </div>

          <form onSubmit={save} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] label-font text-charcoal">Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="rounded-xl bg-cream border border-line px-3 py-2.5 text-sm text-charcoal outline-none focus:border-flame"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] label-font text-charcoal">Categoría</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                  className="rounded-xl bg-cream border border-line px-3 py-2.5 text-sm text-charcoal outline-none focus:border-flame bg-[url('data:image/svg')] bg-no-repeat bg-right bg-pointer"
                >
                  <option value="" disabled>Seleccionar categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 mt-1.5">
                  <input
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="Nueva categoría"
                    className="flex-1 rounded-xl bg-cream border border-line px-3 py-1.5 text-xs text-charcoal outline-none focus:border-flame"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    disabled={!newCat.trim()}
                    className="rounded-xl py-1.5 px-2.5 bg-charcoal text-cream text-xs font-bold disabled:opacity-60"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] label-font text-charcoal">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  className="rounded-xl bg-cream border border-line px-3 py-2.5 text-sm text-charcoal outline-none focus:border-flame"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] label-font text-charcoal">Emoji</label>
                <input
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  placeholder="🍔"
                  className="rounded-xl bg-cream border border-line px-3 py-2.5 text-sm text-center text-2xl outline-none focus:border-flame"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] label-font text-charcoal flex items-center gap-1">
                  <ImageIcon size={10} /> URL de imagen
                </label>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="rounded-xl bg-cream border border-line px-3 py-2.5 text-sm text-charcoal outline-none focus:border-flame"
                />
                {form.image && (
                  <div className="mt-1 w-16 h-16 rounded-xl bg-cream border border-line flex items-center justify-center overflow-hidden">
                    <img src={form.image} alt="preview" className="w-full h-full object-cover rounded-xl" onError={(e) => (e.target.style.display = "none")} />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] label-font text-charcoal">Tag (badge)</label>
                <input
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  placeholder="Popular / Picante / Nuevo"
                  className="rounded-xl bg-cream border border-line px-3 py-2.5 text-sm text-charcoal outline-none focus:border-flame"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] label-font text-charcoal">Etiquetas</label>
                <div className="flex items-center gap-3 text-sm mt-1.5">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={form.hasExtras} onChange={(e) => setForm({ ...form, hasExtras: e.target.checked })} />
                    Extras
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={form.hasSize} onChange={(e) => setForm({ ...form, hasSize: e.target.checked })} />
                    Tamaños
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                    Activo
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] label-font text-charcoal">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción del producto..."
                  rows={2}
                  className="rounded-xl bg-cream border border-line px-3 py-2 text-sm text-charcoal outline-none focus:border-flame resize-y"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 rounded-2xl py-3.5 px-5 bg-flame text-cream font-extrabold text-sm disabled:opacity-60"
              >
                <Save size={16} /> {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="rounded-2xl py-3.5 px-5 bg-paper border border-line text-ink font-bold text-sm"
                >
                  + Nuevo
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-sm text-mute">Cargando productos...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => (
              <div key={p.id} className="bg-paper border border-line rounded-2xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-2xl overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" onError={(e) => (e.target.style.display = "none")} />
                  ) : (
                    p.emoji
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-charcoal leading-tight">{p.name}</div>
                  <div className="text-xs text-mute">{p.category?.name || p.categoryId}</div>
                </div>
                <div className="text-sm font-extrabold text-flame text-right">{money(Number(p.price))}</div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => startEdit(p)}
                    className="w-7 h-7 rounded-full bg-cream border border-line flex items-center justify-center"
                    title="Editar"
                  >
                    <Edit3 size={13} className="text-charcoal" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(p)}
                    className="w-7 h-7 rounded-full bg-cream border border-line flex items-center justify-center"
                    title="Eliminar"
                  >
                    <Trash2 size={13} className="text-mute" />
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-sm text-mute">No hay productos.</div>
            )}
          </div>
        )}
      </div>

      {/* Confirmación de borrado */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-paper rounded-3xl p-5">
            <div className="text-base font-display text-charcoal mb-2">Eliminar {confirmDelete.name}</div>
            <div className="text-sm text-mute mb-4">Esta acción no se puede deshacer.</div>
            <div className="flex flex-col gap-2">
              <button
                disabled={saving}
                onClick={removeProduct}
                className="w-full rounded-2xl py-3 bg-chile text-cream font-extrabold text-sm disabled:opacity-60"
              >
                Eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="w-full rounded-2xl py-3 bg-paper border border-line text-ink font-bold text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
