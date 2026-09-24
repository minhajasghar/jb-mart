import React from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, Clock, MapPin, ShoppingBag, ArrowRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext, getProductImage } from '../context/AppContext';
import { toPng } from 'html-to-image';

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, subcategories, categories } = useAppContext();
  const navigate = useNavigate();
  const receiptRef = React.useRef<HTMLDivElement>(null);

  // Normalize IDs to handle potential space/hyphen mismatches in URL
  const order = orders.find(o => 
    o.id.replace(/[- ]/g, '').toLowerCase() === orderId?.replace(/[- ]/g, '').toLowerCase()
  );

  if (!orderId) {
    return <Navigate to="/" />;
  }

  // If order not found in context (e.g. page refresh and not in localStorage yet), 
  // we can show a loading state or try to get it from localStorage directly
  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Locating your order...</p>
      </div>
    );
  }

  const handleDownload = async () => {
    if (receiptRef.current === null) return;
    
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#131313' });
      const link = document.createElement('a');
      link.download = `JB-Receipt-${order.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download receipt:', err);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary selection:text-on-primary">
      {/* Top Bar */}
      <nav className="fixed top-0 w-full z-50 bg-[#131313]/70 backdrop-blur-[32px] flex justify-between items-center px-6 md:px-10 h-24 shadow-[0_40px_60px_rgba(229,226,225,0.05)]">
        <Link to="/" className="flex items-center gap-5">
          <img src="/JBMM.png" alt="JBMM Logo" className="h-16 md:h-20 w-auto object-contain" />
          <span className="hidden lg:block text-2xl font-black text-primary italic font-headline tracking-tight">
            JB Mega Mart Kitchen
          </span>
        </Link>
        <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors font-bold text-sm uppercase tracking-widest">
          Back to Menu
        </Link>
      </nav>

      <main className="pt-32 pb-20 px-6 md:px-10 max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-500 mb-6 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="font-headline text-4xl md:text-6xl font-black text-on-surface tracking-tighter italic mb-4">
            Order Confirmed<span className="text-primary">.</span>
          </h1>
          <p className="text-on-surface-variant text-lg">
            Thank you for choosing JB Mega Mart Kitchen. Your feast is being prepared with precision.
          </p>
        </motion.div>

        <motion.div 
          ref={receiptRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden relative mb-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="p-8 md:p-10 relative z-10">
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-10 pb-8 border-b border-white/5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-2">Order Identification</p>
                <p className="text-2xl font-mono font-black text-on-surface">#{order.id}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-2">Estimated Arrival</p>
                <div className="flex items-center md:justify-end gap-2 text-2xl font-black text-on-surface">
                  <Clock className="w-6 h-6 text-primary" />
                  <span>30-40 mins</span>
                </div>
              </div>
            </div>

            <div className="space-y-8 mb-10">
              <section>
                <h3 className="flex items-center gap-3 font-headline text-xl font-bold mb-6">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  Order Summary
                </h3>
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (idx * 0.1) }}
                      className="flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-highest overflow-hidden">
                          <img src={getProductImage(item, subcategories, categories)} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{item.name}</p>
                          <p className="text-xs text-on-surface-variant/60">
                            {item.quantity} x Rs. {item.price}
                          </p>
                          {item.instructions && (
                            <p className="text-[10px] text-primary italic font-medium mt-1">Note: {item.instructions}</p>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-on-surface">Rs. {item.price * item.quantity}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section className="pt-6 border-t border-white/5">
                <div className="flex justify-between items-center mb-2 text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>Rs. {order.total - 150 + (order.total > 2000 ? 400 : 0)}</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span>GST ({Math.round(order.taxRate * 100)}%)</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-2 py-0.5 rounded-full">{order.paymentMethod}</span>
                  </div>
                  <span>Rs. {order.taxAmount}</span>
                </div>
                {order.total > 2000 && (
                  <div className="flex justify-between items-center mb-4 text-tertiary">
                    <span>Promotional Discount</span>
                    <span className="font-bold">- Rs. 400</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-primary/20">
                  <span className="text-xl font-bold font-headline">Total Amount</span>
                  <span className="text-3xl font-black font-headline text-primary">Rs. {order.total}</span>
                </div>
              </section>

              <section className="bg-surface-container-highest/30 rounded-3xl p-6 border border-white/5">
                <h3 className="flex items-center gap-3 font-bold mb-4 text-sm uppercase tracking-widest text-primary">
                  <MapPin className="w-4 h-4" />
                  Delivery Details
                </h3>
                <p className="font-bold text-on-surface mb-1">{order.customerName}</p>
                <p className="text-on-surface-variant text-sm mb-2">{order.customerPhone}</p>
                <p className="text-on-surface-variant text-sm leading-relaxed">{order.address}</p>
              </section>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate(`/track-order/${order.id}`)}
                className="md:col-span-1 bg-primary text-on-primary py-5 rounded-full font-black text-sm tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" /> Track
              </button>
              <button 
                onClick={handleDownload}
                className="md:col-span-1 bg-surface-container-highest text-on-surface py-5 rounded-full font-bold text-sm hover:bg-surface-bright transition-colors border border-white/5 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <Link to="/" className="md:col-span-1">
                <button className="w-full bg-surface-container-highest text-on-surface py-5 rounded-full font-bold text-sm hover:bg-surface-bright transition-colors border border-white/5 flex items-center justify-center gap-2">
                  Order More <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-on-surface-variant/40 uppercase tracking-[0.2em]">
          A confirmation email and SMS have been sent to your details.
        </p>
      </main>
    </div>
  );
}
