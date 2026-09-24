import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, History, ArrowRight, Package, ChevronRight, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function OrderSearch() {
  const [searchId, setSearchId] = useState('');
  const [error, setError] = useState('');
  const { recentOrders, orders } = useAppContext();
  const navigate = useNavigate();

  // If a new user somehow lands here without orders, send them home
  React.useEffect(() => {
    const activeRecentOrders = recentOrders.filter(id => {
      const details = orders.find(o => o.id === id);
      return details && details.status !== 'Completed';
    });

    if (activeRecentOrders.length === 1) {
      navigate(`/track-order/${activeRecentOrders[0]}`);
    } else if (recentOrders.length === 0) {
      navigate('/');
    }
  }, [recentOrders, orders, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    // Normalize ID
    const normalizedId = searchId.trim().toUpperCase().replace(/\s+/g, '-');
    
    // Strict Validation: Must be in recentOrders
    if (recentOrders.includes(normalizedId)) {
      navigate(`/track-order/${normalizedId}`);
    } else {
      setError('This order ID was not placed on this device. You can only track your own orders for security.');
    }
  };

  const getOrderDetails = (id: string) => {
    return orders.find(o => o.id === id);
  };

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary selection:text-on-primary">
      {/* Top Bar */}
      <nav className="fixed top-0 w-full z-50 bg-[#131313]/70 backdrop-blur-[32px] flex justify-between items-center px-6 md:px-10 h-20 shadow-[0_40px_60px_rgba(229,226,225,0.05)]">
        <Link to="/" className="flex items-center gap-3">
          <img src="/JBMM.png" alt="JBMM Logo" className="h-10 w-auto" />
          <span className="hidden lg:block text-2xl font-black text-primary italic font-headline tracking-tight">
            JB Mega Mart Kitchen
          </span>
        </Link>
        <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors font-bold text-sm uppercase tracking-widest">
          Back to Menu
        </Link>
      </nav>

      <main className="pt-32 pb-20 px-6 md:px-10 max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-headline text-5xl md:text-7xl font-black text-on-surface tracking-tighter italic mb-6">
            Order History<span className="text-primary">.</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
            Review your recent food selections or manually track an order placed on this device.
          </p>
        </motion.div>

        <div className="flex justify-center">
          {/* Recent Orders Section */}
          <div className="w-full max-w-2xl">
            <div className="glass-card rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden h-full">
              <h2 className="flex items-center gap-3 font-headline text-2xl font-bold mb-8">
                <History className="w-6 h-6 text-primary" />
                Recent Orders
              </h2>

              {(() => {
                const activeRecentOrders = recentOrders.filter(id => {
                  const details = getOrderDetails(id);
                  return details && details.status !== 'Completed';
                });

                if (activeRecentOrders.length === 0) {
                  return (
                    <div className="text-center py-12 bg-surface-container-highest/30 rounded-3xl border border-dashed border-white/10">
                      <Clock className="w-10 h-10 mx-auto text-on-surface-variant/20 mb-4" />
                      <p className="text-on-surface-variant text-sm px-6">No active orders found on this device.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {activeRecentOrders.map((id) => {
                      const details = getOrderDetails(id);
                      return (
                        <motion.div 
                          key={id}
                          whileHover={{ x: 5 }}
                          className="group"
                        >
                          <Link 
                            to={`/track-order/${id}`}
                            className="flex items-center justify-between p-5 rounded-2xl bg-surface-container-highest border border-white/5 hover:border-primary/30 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-mono font-bold text-on-surface">#{id}</p>
                                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold">
                                  {details?.status || 'Unknown Status'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-on-surface-variant/30 group-hover:text-primary transition-colors" />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}

              <p className="mt-8 text-[10px] text-center text-on-surface-variant/40 uppercase tracking-[0.2em] leading-relaxed">
                We only show the last 5 orders placed on this browser for your security.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center">
        <p className="text-xs text-on-surface-variant/40 uppercase tracking-[0.2em]">
          Culinary Noir • Premium Hospitality Systems
        </p>
      </footer>
    </div>
  );
}
