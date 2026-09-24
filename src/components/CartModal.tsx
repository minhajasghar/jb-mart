import React from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useAppContext, getProductImage } from '../context/AppContext';

export default function CartModal() {
  const { cart, updateQuantity, updateInstructions, removeFromCart, isCartOpen, setIsCartOpen, subcategories, categories } = useAppContext();

  if (!isCartOpen) return null;

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + ((item.price ?? 0) * item.quantity), 0);

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-xl transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Drawer Content */}
      <div className="relative w-full max-w-md bg-surface-container-low border-l border-white/5 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h3 className="font-headline text-xl font-black italic">
              Your Cart <span className="text-xs font-normal not-italic ml-2 px-3 py-1 bg-primary text-on-primary rounded-full">{cartItemCount} Items</span>
            </h3>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:scale-105 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-grow overflow-y-auto no-scrollbar p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 mx-auto text-on-surface-variant/20 mb-4" />
              <p className="text-on-surface-variant font-medium">Your cart is empty.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-4 text-primary font-bold text-sm uppercase tracking-widest hover:underline"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-start gap-4 p-4 bg-surface-container-high/40 rounded-2xl border border-white/5 hover:bg-surface-container-high/60 transition-colors group">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                  <img alt={item.name} className="w-full h-full object-cover" src={getProductImage(item, subcategories, categories)} />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-on-surface leading-tight text-sm">{item.name}</h4>
                      {item.subcategoryIds && item.subcategoryIds.length > 0 && (() => {
                        const selected = subcategories.filter(s => item.subcategoryIds!.includes(s.id));
                        return selected.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selected.map(s => (
                              <span key={s.id} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <span className="text-primary font-headline font-bold text-sm whitespace-nowrap ml-4">Rs. {(item.price ?? 0) * item.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-secondary/50">
                      {item.variant ? `Variant: ${item.variant}` : `Qty: ${String(item.quantity).padStart(2, '0')}`}
                    </p>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)} 
                        className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors active:scale-90"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)} 
                        className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors active:scale-90"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="ml-2 text-error hover:text-error/80 transition-colors active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="mt-3">
                    <input 
                      type="text" 
                      placeholder="Special instructions (e.g. no onions)"
                      value={item.instructions || ''}
                      onChange={(e) => updateInstructions(item.id, e.target.value)}
                      className="w-full bg-surface-container-lowest/80 border border-white/5 rounded-lg p-2 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-white/5 bg-surface-container/50 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-secondary/60">Subtotal</span>
              <span className="font-headline font-bold text-lg text-on-surface">Rs. {subtotal}</span>
            </div>
            <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest leading-relaxed">
              Taxes and delivery fee calculated at checkout.
            </p>
            
            <Link 
              to="/checkout" 
              onClick={() => setIsCartOpen(false)}
              className="block"
            >
              <button className="w-full bg-primary text-on-primary py-4 rounded-full font-black text-lg tracking-widest uppercase hover:bg-white hover:text-black hover:scale-102 active:scale-95 transition-all duration-300 shadow-xl shadow-primary/20 cursor-pointer">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
