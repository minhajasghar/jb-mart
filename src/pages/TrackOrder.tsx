import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, MapPin, Clock, CheckCircle2, ChevronLeft, Truck, ShoppingBag, RefreshCcw } from 'lucide-react';
import { useAppContext, OrderStatus } from '../context/AppContext';
import LocationModal from '../components/LocationModal';

const statusSteps: { status: OrderStatus; label: string; description: string; icon: any }[] = [
  { status: 'Pending', label: 'Order Received', description: 'We have received your order and are confirming it.', icon: Package },
  { status: 'Preparing', label: 'In the Kitchen', description: 'Our chefs are crafting your delicious meal with precision.', icon: Clock },
  { status: 'Out for Delivery', label: 'On its Way', description: 'Your feast has left our kitchen and is headed to you.', icon: Truck },
  { status: 'Completed', label: 'Delivered', description: 'Bon appétit! Your order has been delivered.', icon: CheckCircle2 },
];

export default function TrackOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const { 
    orders, 
    recentOrders,
    orderType,
    userLocation,
    setIsLocationVerified 
  } = useAppContext();
  const [order, setOrder] = useState(orders.find(o => o.id === orderId));
  
  const isOwner = recentOrders.includes(orderId || '');

  useEffect(() => {
    const foundOrder = orders.find(o => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    }
  }, [orders, orderId]);

  if (!isOwner) {
    return <Navigate to="/" replace />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Locating your order...</p>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex(step => step.status === order.status);

  const activeRecentOrders = recentOrders.filter(id => {
    const details = orders.find(o => o.id === id);
    return details && details.status !== 'Completed';
  });

  return (
    <>
      <LocationModal />
      <div className="bg-background text-on-background min-h-screen selection:bg-primary selection:text-on-primary">
      {/* Top Bar */}
      <nav className="fixed top-0 w-full z-50 bg-[#131313]/70 backdrop-blur-[32px] flex justify-between items-center px-6 md:px-10 h-24 shadow-[0_40px_60px_rgba(229,226,225,0.05)]">
        <Link to="/" className="flex items-center gap-5">
          <img src="/JBMM.png" alt="JBMM Logo" className="h-16 md:h-20 w-auto object-contain" />
          <span className="hidden lg:block text-2xl font-black text-primary italic font-headline tracking-tight">
            JB Mega Mart Kitchen
          </span>
        </Link>
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setIsLocationVerified(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-container-highest border border-white/5 hover:bg-surface-bright transition-all text-[10px] font-black uppercase tracking-widest text-primary shrink-0"
          >
            {orderType === 'Delivery' ? (
              <><Truck className="w-3 h-3" /> {userLocation ? `${userLocation.substring(0, 10)}...` : 'Delivery'}</>
            ) : (
              <><ShoppingBag className="w-3 h-3" /> Pickup</>
            )}
          </button>
          {activeRecentOrders.length > 1 && (
            <Link to="/track" className="text-on-surface-variant hover:text-primary transition-colors font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              View Order History
            </Link>
          )}
          <Link to={`/order-confirmation/${orderId}`} className="text-on-surface-variant hover:text-primary transition-colors font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back to Summary
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 md:px-10 max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-headline text-4xl md:text-6xl font-black text-on-surface tracking-tighter italic mb-4">
            Track Your Order<span className="text-primary">.</span>
          </h1>
          <p className="text-on-surface-variant text-lg">
            Order <span className="font-mono text-primary font-bold">#{orderId}</span> is currently in the <span className="text-primary font-bold lowercase">{order.status}</span> stage.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-[2.5rem] border border-white/5 p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="relative z-10 space-y-12">
                {statusSteps.map((step, index) => {
                  const isCompleted = index < currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const isPending = index > currentStatusIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex gap-6 relative">
                      {/* Connector Line */}
                      {index < statusSteps.length - 1 && (
                        <div className={`absolute left-7 top-14 w-0.5 h-16 ${isCompleted ? 'bg-primary' : 'bg-white/10'}`} />
                      )}

                      {/* Icon Circle */}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${
                        isCompleted ? 'bg-primary border-primary text-on-primary' : 
                        isCurrent ? 'bg-primary/20 border-primary text-primary animate-pulse shadow-[0_0_20px_rgba(255,193,7,0.3)]' : 
                        'bg-surface-container-highest border-white/5 text-on-surface-variant/40'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Text Content */}
                      <div className={`pt-2 transition-all duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                        <h3 className={`text-xl font-bold mb-1 ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>
                          {step.label}
                        </h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          {step.description}
                        </p>
                        {isCurrent && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            className="h-1 bg-primary/20 rounded-full mt-4 overflow-hidden"
                          >
                            <motion.div 
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                              className="w-1/3 h-full bg-primary"
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 text-primary font-bold hover:underline transition-all"
              >
                <RefreshCcw className="w-4 h-4" /> Refresh Status
              </button>
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="space-y-6">
            {isOwner ? (
              <section className="glass-card rounded-[2rem] border border-white/5 p-6 shadow-xl">
                <h3 className="flex items-center gap-3 font-bold mb-6 text-sm uppercase tracking-widest text-primary">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </h3>
                <p className="font-bold text-on-surface mb-1">{order.customerName}</p>
                <p className="text-on-surface-variant text-sm leading-relaxed">{order.address}</p>
              </section>
            ) : (
              <section className="glass-card rounded-[2rem] border border-white/5 p-6 shadow-xl bg-surface-container-highest/20">
                <h3 className="flex items-center gap-3 font-bold mb-4 text-xs uppercase tracking-widest text-primary/50">
                  <MapPin className="w-4 h-4" />
                  Private Order
                </h3>
                <p className="text-xs text-on-surface-variant/60 leading-relaxed italic">
                  Delivery details are hidden for privacy. Only the device that placed this order can see the address.
                </p>
              </section>
            )}

            <section className="glass-card rounded-[2rem] border border-white/5 p-6 shadow-xl">
              <h3 className="flex items-center gap-3 font-bold mb-6 text-sm uppercase tracking-widest text-primary">
                <Clock className="w-4 h-4" />
                Estimated Arrival
              </h3>
              <p className="text-3xl font-black text-on-surface italic">30-40 <span className="text-lg not-italic font-bold text-on-surface-variant">mins</span></p>
              <p className="text-xs text-on-surface-variant mt-2 uppercase tracking-widest font-medium">Prepared with care</p>
            </section>

            <Link to="/" className="block">
              <button className="w-full bg-surface-container-highest text-on-surface py-5 rounded-full font-bold text-sm hover:bg-surface-bright transition-colors border border-white/5">
                Return to Menu
              </button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center">
        <p className="text-xs text-on-surface-variant/40 uppercase tracking-[0.2em]">
          Powered by Culinary Noir Systems • Premium Delivery Service
        </p>
      </footer>
    </div>
    </>
  );
}
