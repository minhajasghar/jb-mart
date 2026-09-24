import React, { useState, useEffect } from 'react';
import { useAppContext, Product, Category, Subcategory } from '../context/AppContext';
import { ChevronUp, ChevronDown, Save, Package, GripVertical, X, Edit3, Check, Image as ImageIcon } from 'lucide-react';

type OrderItem = {
  type: 'category' | 'subcategory' | 'product';
  id: string;
  displayOrder: number;
};

export default function MenuEditor() {
  const {
    categories, products, subcategories,
    getCategorySubcategories, updateCategory, updateProduct, updateSubcategory
  } = useAppContext();

  const sortedCategories = [...categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [localSubcategories, setLocalSubcategories] = useState<Subcategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [expandCat, setExpandCat] = useState<string | null>(null);

  useEffect(() => {
    setLocalProducts(products.map(p => ({...p})));
    setLocalSubcategories(subcategories.map(s => ({...s})));
  }, [products, subcategories]);

  const sortedProducts = (catId: string, subcatId?: string) => {
    return localProducts
      .filter(p => {
        if (subcatId) return p.subcategoryId === subcatId;
        return p.categoryId === catId && !p.subcategoryId;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  };

  const moveItem = <T extends {id: string}>(items: T[], index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return items;
    const result = [...items];
    const [removed] = result.splice(index, 1);
    result.splice(newIndex, 0, removed);
    return result;
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const cats = sortedCategories.map(c => ({ id: c.id, displayOrder: c.displayOrder || 0 }));
    const moved = moveItem(cats, index, direction);
    if (moved === cats) return;
    const items: OrderItem[] = moved.map((c, i) => ({ type: 'category', id: c.id, displayOrder: i + 1 }));
    saveReorder(items);
  };

  const moveSubcategory = (catId: string, index: number, direction: 'up' | 'down') => {
    const subcats = getCategorySubcategories(catId)
      .map(s => ({ id: s.id, displayOrder: s.displayOrder || 0 }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const moved = moveItem(subcats, index, direction);
    if (moved === subcats) return;
    const items: OrderItem[] = moved.map((s, i) => ({ type: 'subcategory', id: s.id, displayOrder: i + 1 }));
    saveReorder(items);
  };

  const moveProductLocal = (catId: string, subcatId: string | undefined, index: number, direction: 'up' | 'down') => {
    const prodList = localProducts
      .filter(p => subcatId ? p.subcategoryId === subcatId : (p.categoryId === catId && !p.subcategoryId))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const mapped = prodList.map(p => ({ id: p.id, displayOrder: p.displayOrder || 0 }));
    const moved = moveItem(mapped, index, direction);
    if (moved === mapped) return;
    const items: OrderItem[] = moved.map((p, i) => ({ type: 'product', id: p.id, displayOrder: i + 1 }));
    saveReorder(items);
  };

  const saveReorder = async (items: OrderItem[]) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (!res.ok) throw new Error('Failed to reorder');
      setMessage({ type: 'success', text: 'Order updated!' });
      setTimeout(() => { window.location.reload(); }, 800);
    } catch {
      setMessage({ type: 'error', text: 'Failed to save order' });
    } finally {
      setSaving(false);
    }
  };

  const toggleOutOfStock = async (product: Product) => {
    try {
      await updateProduct({
        ...product,
        isOutOfStock: !product.isOutOfStock,
        price: product.price ?? 0,
        image: product.image || ''
      });
      setLocalProducts(localProducts.map(p => p.id === product.id ? {...p, isOutOfStock: !p.isOutOfStock} : p));
    } catch {
      setMessage({ type: 'error', text: 'Failed to update item' });
    }
  };

  const startEdit = (id: string, name: string, price?: number | null) => {
    setEditingId(id);
    setEditName(name);
    setEditPrice(price !== null && price !== undefined ? String(price) : '');
  };

  const saveEdit = async (product: Product) => {
    const newName = editName.trim() || product.name;
    const newPrice = editPrice ? parseFloat(editPrice) : null;
    try {
      await updateProduct({
        ...product,
        name: newName,
        price: newPrice,
        image: product.image || ''
      });
      setLocalProducts(localProducts.map(p => p.id === product.id ? {...p, name: newName, price: newPrice} : p));
      setEditingId(null);
      setMessage({ type: 'success', text: 'Item updated!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update item' });
    }
  };

  if (sortedCategories.length === 0) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-xl font-bold">No categories found</p>
        <p className="text-sm mt-2">Add categories in the Inventory tab first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight">Menu Editor</h2>
          <p className="text-on-surface-variant text-sm mt-1">Drag to reorder categories, subcategories, and items</p>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <span className={`text-sm font-bold px-4 py-2 rounded-full ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {message.text}
            </span>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {sortedCategories.map((cat, catIdx) => {
          const subcats = getCategorySubcategories(cat.id).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          const catProducts = sortedProducts(cat.id);
          const hasSubcategories = cat.hasSubcategories && subcats.length > 0;
          const isExpanded = expandCat === cat.id;

          return (
            <div key={cat.id} className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
              {/* Category Header */}
              <div className="flex items-center gap-4 p-5 bg-surface-container-low">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveCategory(catIdx, 'up')} className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30" disabled={catIdx === 0}>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveCategory(catIdx, 'down')} className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30" disabled={catIdx === sortedCategories.length - 1}>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex-shrink-0 overflow-hidden">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-on-surface truncate">{cat.name}</h3>
                  <p className="text-xs text-on-surface-variant">
                    {hasSubcategories ? `${subcats.length} subcategories` : `${catProducts.length} items`}
                  </p>
                </div>
                <button
                  onClick={() => setExpandCat(isExpanded ? null : cat.id)}
                  className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {isExpanded ? 'Collapse' : 'Edit Items'}
                </button>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-5 border-t border-white/5">
                  {hasSubcategories ? (
                    <div className="space-y-4">
                      {subcats.map((subcat, scIdx) => {
                        const subcatProds = localProducts
                          .filter(p => p.subcategoryId === subcat.id)
                          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                        return (
                          <div key={subcat.id} className="bg-surface-container-low rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex flex-col gap-1">
                                <button onClick={() => moveSubcategory(cat.id, scIdx, 'up')} className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30" disabled={scIdx === 0}>
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button onClick={() => moveSubcategory(cat.id, scIdx, 'down')} className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30" disabled={scIdx === subcats.length - 1}>
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex-shrink-0 overflow-hidden">
                                {subcat.image ? (
                                  <img src={subcat.image} alt={subcat.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-on-surface text-sm">{subcat.name}</span>
                              <span className="text-xs text-on-surface-variant ml-auto">{subcatProds.length} items</span>
                            </div>
                            {subcatProds.length > 0 && (
                              <div className="ml-12 space-y-2">
                                {subcatProds.map((prod, pIdx) => (
                                  <div key={prod.id}>
                                    <ProductRow
                                      product={prod}
                                      index={pIdx}
                                      total={subcatProds.length}
                                      onMove={(dir) => moveProductLocal(cat.id, subcat.id, pIdx, dir)}
                                      onToggleOutOfStock={() => toggleOutOfStock(prod)}
                                      editingId={editingId}
                                      editName={editName}
                                      editPrice={editPrice}
                                      setEditName={setEditName}
                                      setEditPrice={setEditPrice}
                                      setEditingId={setEditingId}
                                      startEdit={startEdit}
                                      saveEdit={saveEdit}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {catProducts.map((prod, pIdx) => (
                        <div key={prod.id}>
                          <ProductRow
                            product={prod}
                            index={pIdx}
                            total={catProducts.length}
                            onMove={(dir) => moveProductLocal(cat.id, undefined, pIdx, dir)}
                            onToggleOutOfStock={() => toggleOutOfStock(prod)}
                            editingId={editingId}
                            editName={editName}
                            editPrice={editPrice}
                            setEditName={setEditName}
                            setEditPrice={setEditPrice}
                            setEditingId={setEditingId}
                            startEdit={startEdit}
                            saveEdit={saveEdit}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ProductRowProps = {
  product: Product;
  index: number;
  total: number;
  onMove: (dir: 'up' | 'down') => void;
  onToggleOutOfStock: () => void;
  editingId: string | null;
  editName: string;
  editPrice: string;
  setEditName: (v: string) => void;
  setEditPrice: (v: string) => void;
  setEditingId: (v: string | null) => void;
  startEdit: (id: string, name: string, price?: number | null) => void;
  saveEdit: (product: Product) => void;
};

function ProductRow({ product, index, total, onMove, onToggleOutOfStock, editingId, editName, editPrice, setEditName, setEditPrice, setEditingId, startEdit, saveEdit }: ProductRowProps) {
  const isEditing = editingId === product.id;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${product.isOutOfStock ? 'opacity-50' : ''} ${isEditing ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-surface-container-highest/50 hover:bg-surface-container-highest'}`}>
      <div className="flex flex-col gap-0.5">
        <button onClick={() => onMove('up')} className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-20" disabled={index === 0}>
          <ChevronUp className="w-3 h-3" />
        </button>
        <button onClick={() => onMove('down')} className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-20" disabled={index === total - 1}>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
      <div className="w-10 h-10 rounded-lg bg-surface-container-low flex-shrink-0 overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <Package className="w-4 h-4" />
          </div>
        )}
      </div>
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 bg-surface-container-highest border border-white/10 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none min-w-0"
          />
          <input
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            className="w-20 bg-surface-container-highest border border-white/10 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
            placeholder="Price"
          />
          <button onClick={() => saveEdit(product)} className="text-green-400 hover:text-green-300 transition-colors p-1">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setEditingId(null)} className="text-on-surface-variant hover:text-on-surface transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-on-surface truncate block">{product.name}</span>
            {product.price !== null && (
              <span className="text-xs text-on-surface-variant">Rs. {product.price}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleOutOfStock}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${product.isOutOfStock ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
            >
              {product.isOutOfStock ? 'Out' : 'In'}
            </button>
            <button
              onClick={() => startEdit(product.id, product.name, product.price)}
              className="text-on-surface-variant hover:text-primary transition-colors p-1"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
