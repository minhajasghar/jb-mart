import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Crop, X, Check } from 'lucide-react';

type Props = {
  imageUrl: string;
  onCrop: (croppedBase64: string) => void;
  onCancel: () => void;
  onSkip?: () => void;
  aspectRatio?: number;
};

export default function ImageCropper({ imageUrl, onCrop, onCancel, onSkip, aspectRatio }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const maxW = 600;
      const maxH = 500;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const s = Math.min(maxW / w, maxH / h, 1);
      w *= s; h *= s;
      setScale(s);
      setImgSize({ w, h });
      setCrop({ x: 0, y: 0, w, h });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    if (action === 'drag') {
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setCropStart({ ...crop });
    } else {
      setResizing(action);
      setDragStart({ x: e.clientX, y: e.clientY });
      setCropStart({ ...crop });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(imgSize.w - prev.w, cropStart.x + dx)),
        y: Math.max(0, Math.min(imgSize.h - prev.h, cropStart.y + dy)),
      }));
    } else if (resizing) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setCrop(prev => {
        let { x, y, w, h } = cropStart;
        if (resizing === 'se') { w = Math.max(50, cropStart.w + dx); h = Math.max(50, cropStart.h + dy); }
        else if (resizing === 'sw') { w = Math.max(50, cropStart.w - dx); h = Math.max(50, cropStart.h + dy); x = cropStart.x + dx; }
        else if (resizing === 'ne') { w = Math.max(50, cropStart.w + dx); h = Math.max(50, cropStart.h - dy); y = cropStart.y + dy; }
        else if (resizing === 'nw') { w = Math.max(50, cropStart.w - dx); h = Math.max(50, cropStart.h - dy); x = cropStart.x + dx; y = cropStart.y + dy; }
        return { x: Math.max(0, x), y: Math.max(0, y), w: Math.min(imgSize.w - x, w), h: Math.min(imgSize.h - y, h) };
      });
    }
  }, [dragging, resizing, dragStart, cropStart, imgSize]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setResizing(null);
  }, []);

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  const applyCrop = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const sx = crop.x / scale;
    const sy = crop.y / scale;
    const sw = crop.w / scale;
    const sh = crop.h / scale;
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const base64 = canvas.toDataURL('image/png');
    onCrop(base64);
  };

  if (imgSize.w === 0) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-surface-container-low rounded-[2rem] p-6 max-w-2xl w-full shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Crop className="w-5 h-5 text-primary" /> Crop Image
          </h3>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div
          ref={containerRef}
          className="relative mx-auto overflow-hidden rounded-2xl bg-black/40"
          style={{ width: imgSize.w, height: imgSize.h }}
        >
          <img ref={imgRef} src={imageUrl} alt="Crop preview" className="absolute inset-0 w-full h-full object-contain" draggable={false} />
          <div
            className="absolute border-2 border-primary cursor-move"
            style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
          >
            <div className="absolute inset-0 bg-primary/10" />
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary cursor-nw-resize" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary cursor-ne-resize" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary cursor-sw-resize" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary cursor-se-resize" onMouseDown={(e) => handleMouseDown(e, 'se')} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-on-surface-variant">Drag to move crop area. Drag corners to resize.</p>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-5 py-2 rounded-full text-sm font-bold bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-colors">
              Cancel Upload
            </button>
            {onSkip && (
              <button onClick={onSkip} className="px-5 py-2 rounded-full text-sm font-bold bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-colors">
                Skip Crop
              </button>
            )}
            <button onClick={applyCrop} className="px-5 py-2 rounded-full text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Crop className="w-4 h-4" /> Apply Crop
            </button>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
