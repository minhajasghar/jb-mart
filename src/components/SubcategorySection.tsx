import React, { useState } from 'react';
import type { Subcategory } from '../context/AppContext';
import { Upload, Trash2 } from 'lucide-react';

interface SubcategorySectionProps {
  categoryId: string;
  newSubcategoryName: string;
  setNewSubcategoryName: React.Dispatch<React.SetStateAction<string>>;
  newSubcategoryPrice: number;
  setNewSubcategoryPrice: React.Dispatch<React.SetStateAction<number>>;
  addSubcategory: (subcategory: Subcategory) => void;
  updateSubcategory?: (subcategory: Subcategory) => void;
  deleteSubcategory: (id: string) => void;
  getCategorySubcategories: (categoryId: string) => Subcategory[];
  onAddItem?: (subcategoryId: string, subcategoryName: string) => void;
  uploadImage?: (file: File) => Promise<string>;
  uploading?: boolean;
}

export default function SubcategorySection({
  categoryId,
  newSubcategoryName,
  setNewSubcategoryName,
  newSubcategoryPrice,
  setNewSubcategoryPrice,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getCategorySubcategories,
  onAddItem,
  uploadImage,
  uploading,
}: SubcategorySectionProps) {
  const catSubcategories = getCategorySubcategories(categoryId);
  const [subcatImage, setSubcatImage] = useState('');
  const [editImageId, setEditImageId] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState('');

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadImage) return;
    const previewUrl = URL.createObjectURL(file);
    setSubcatImage(previewUrl);
    try {
      const url = await uploadImage(file);
      setSubcatImage(url);
    } catch (_) {
      setSubcatImage('');
    }
  };

  const handleAdd = () => {
    if (!newSubcategoryName.trim()) return;
    const id = 'subcat-' + categoryId + '-' + newSubcategoryName.toLowerCase().replace(/\s+/g, '-');
    addSubcategory({
      id,
      categoryId,
      name: newSubcategoryName.trim(),
      required: false,
      priceAdjustment: newSubcategoryPrice || 0,
      price: newSubcategoryPrice || null,
      displayOrder: catSubcategories.length + 1,
      image: subcatImage || undefined,
    });
    setNewSubcategoryName('');
    setNewSubcategoryPrice(0);
    setSubcatImage('');
  };

  return (
    <div className="bg-surface-container-highest/40 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Subcategory Options</label>
        <div className="flex gap-2">
          <input
            value={newSubcategoryName}
            onChange={(e) => setNewSubcategoryName(e.target.value)}
            className="bg-surface-container-highest border-none rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary w-24"
            placeholder="Name"
          />
          <input
            type="number"
            value={newSubcategoryPrice}
            onChange={(e) => setNewSubcategoryPrice(Number(e.target.value))}
            className="bg-surface-container-highest border-none rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary w-16"
            placeholder="Price"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="bg-primary text-on-primary px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Subcategory image - upload or URL */}
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2 text-[10px] text-on-surface-variant hover:text-primary transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{subcatImage ? 'Change image' : 'Upload image'}</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
          <span className="text-[10px] text-on-surface-variant/50">or</span>
          <input
            type="text"
            value={subcatImage}
            onChange={(e) => setSubcatImage(e.target.value)}
            className="bg-surface-container-highest border-none rounded-lg px-2 py-1 text-xs flex-1 focus:ring-1 focus:ring-primary"
            placeholder="Or type URL like /pepsi.png"
          />
        </div>
        {subcatImage && (
          <div className="flex items-center gap-2 mt-2">
            <img src={subcatImage} alt="" className="w-10 h-10 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => setSubcatImage('')}
              className="text-red-500 hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {catSubcategories.length === 0 ? (
        <p className="text-[10px] text-on-surface-variant/50 italic">No subcategories. Add options like "Chicken Supreme", "Pineapple" etc.</p>
      ) : (
        <div className="space-y-1">
          {catSubcategories.map(sc => (
            <div key={sc.id} className="bg-surface-container-low px-3 py-2 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sc.image && (
                    <img src={sc.image} alt="" className="w-7 h-7 object-cover rounded-lg" />
                  )}
                  <span className="text-xs font-bold">{sc.name}</span>
                  {(sc.price || sc.priceAdjustment) ? (
                    <span className="text-[10px] text-on-surface-variant">
                      Rs. {sc.price || sc.priceAdjustment}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {onAddItem && (
                    <button
                      type="button"
                      onClick={() => onAddItem(sc.id, sc.name)}
                      className="text-[10px] text-primary font-bold hover:underline"
                    >
                      + Add Items
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditImageId(editImageId === sc.id ? null : sc.id);
                      setEditImageUrl(sc.image || '');
                    }}
                    className="text-[10px] text-primary/70 hover:text-primary font-bold"
                    title="Set image URL"
                  >
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (window.confirm(`Delete subcategory "${sc.name}"?`)) deleteSubcategory(sc.id); }}
                    className="text-[10px] text-red-500 font-bold hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {editImageId === sc.id && (
                <div className="flex flex-col gap-2 mt-2 ml-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="bg-surface-container-highest border-none rounded-lg px-2 py-1 text-xs flex-1 focus:ring-1 focus:ring-primary"
                      placeholder="/pepsi.png or /uploads/filename.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!updateSubcategory) return;
                        updateSubcategory({ ...sc, image: editImageUrl || undefined });
                        setEditImageId(null);
                      }}
                      className="bg-primary text-on-primary px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-primary/90"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditImageId(null)}
                      className="text-[10px] text-on-surface-variant hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  {uploadImage && (
                    <label className="flex items-center gap-2 text-[10px] text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>Upload file</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadImage(file);
                            setEditImageUrl(url);
                          } catch (_) {}
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
