import React from 'react';
import { useAppContext, OrderStatus } from '../context/AppContext';
import { ChefHat, Clock, Check, Play, ArrowLeft, Package, Truck, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
export default function Kitchen() {
  const { orders, updateOrderStatus, products, updateProduct } = useAppContext();
  const lastOrderIdsRef = React.useRef<string[]>([]);

  // Sound effect helper (Web Audio API - Bell Ring)
  const playNotificationSound = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // Bell-like frequency
      
      gainNode.gain.setValueAtTime(0.5, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.5); // Decay
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 1.5);
    } catch (e) {
      console.warn('Web Audio API failed or blocked:', e);
    }
  };

  // Filter for live orders (Pending and Preparing)
  // Sort by createdAt ascending (oldest first) so cooks handle first orders first
  const liveOrders = orders
    .filter(order => order.status === 'Pending' || order.status === 'Preparing' || order.status === 'Out for Delivery')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Play alert sound repeatedly while there are pending orders
  const hasPendingOrders = liveOrders.some(o => o.status === 'Pending');

  React.useEffect(() => {
    if (!hasPendingOrders) return;

    const interval = setInterval(() => {
      playNotificationSound();
    }, 3000);

    return () => clearInterval(interval);
  }, [hasPendingOrders]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const getTimeElapsed = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-black italic tracking-tighter">KITCHEN <span className="text-primary">DISPLAY</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={playNotificationSound}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-primary shrink-0"
          >
            <Bell className="w-3 h-3" /> Test Sound
          </button>
          <div className="bg-surface-container-highest px-4 py-2 rounded-full text-sm font-bold">
            Live Orders: <span className="text-primary">{liveOrders.length}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {liveOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <ChefHat className="w-16 h-16 text-white/20 mb-4" />
          <p className="text-white/40 text-xl font-bold">No live orders. Good job!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {liveOrders.map(order => {
            const isPending = order.status === 'Pending';
            const isPreparing = order.status === 'Preparing';
            
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-[#1c1b1b] rounded-2xl border ${isPreparing ? 'border-primary/50 shadow-[0_0_15px_rgba(185,29,29,0.2)]' : 'border-white/5'} overflow-hidden flex flex-col h-full`}
              >
                {/* Card Header */}
                <div className={`p-4 ${isPreparing ? 'bg-primary/20' : 'bg-white/5'} flex justify-between items-center`}>
                  <div>
                    <h2 className="text-xl font-black font-mono text-primary">{order.id}</h2>
                    <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeElapsed(order.createdAt)}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isPreparing ? 'bg-primary text-on-primary' : 'bg-white/10 text-white'}`}>
                    {order.status}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 text-xs space-y-1">
                  <div className="font-bold text-white/90">Customer: {order.customerName}</div>
                  <div className="text-white/60">Phone: {order.customerPhone}</div>
                  <div className="text-white/40 leading-snug break-words">Address: {order.address}</div>
                </div>

                {/* Card Content (Items) */}
                <div className="p-4 flex-grow">
                  <ul className="space-y-3">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="border-b border-white/5 pb-2 last:border-0">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-lg flex-grow">
                            <span className="text-primary mr-2 font-black">{item.quantity}x</span>
                            {item.name}
                          </div>
                          {item.variant && (
                            <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-white/70">
                              {item.variant}
                            </span>
                          )}
                        </div>
                        {item.instructions && (
                          <div className="text-sm text-yellow-400 italic mt-1 bg-yellow-400/10 p-2 rounded border border-yellow-400/20">
                            Note: {item.instructions}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer (Actions) */}
                <div className="p-4 border-t border-white/5 bg-white/5">
                  {isPending && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'Preparing')}
                      className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all active:scale-95"
                    >
                      <Play className="w-5 h-5 fill-current" /> Start Preparing
                    </button>
                  )}
                  {isPreparing && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'Out for Delivery')}
                      className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                    >
                      <Truck className="w-5 h-5" /> Mark Out for Delivery
                    </button>
                  )}
                  {order.status === 'Out for Delivery' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'Completed')}
                      className="w-full bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                    >
                      <Check className="w-5 h-5" /> Mark Delivered
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Menu Availability Section */}
      <div className="mt-12 border-t border-white/10 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-black italic tracking-tighter">MENU <span className="text-primary">AVAILABILITY</span></h2>
          <span className="text-xs text-white/50">(Tap to toggle stock status)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => updateProduct({...product, isOutOfStock: !product.isOutOfStock})}
              className={`p-4 rounded-xl border font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 ${
                product.isOutOfStock 
                  ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                  : 'bg-white/5 border-white/5 text-white hover:bg-white/10'
              }`}
            >
              <div className="text-center">{product.name}</div>
              <div className={`text-xs px-2 py-0.5 rounded-full ${
                product.isOutOfStock ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
              }`}>
                {product.isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
