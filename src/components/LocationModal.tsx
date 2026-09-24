import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Truck, ShoppingBag, X, CheckCircle2, Navigation } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import LocationAutocomplete from './LocationAutocomplete';

export default function LocationModal() {
  const { 
    isLocationVerified, 
    setIsLocationVerified, 
    orderType, 
    setOrderType, 
    userLocation, 
    setUserLocation 
  } = useAppContext();

  const [hasError, setHasError] = useState(false);

  const deliveryRadius = (() => {
    const saved = localStorage.getItem('jb_store_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.deliveryRadius !== undefined ? settings.deliveryRadius : 10;
    }
    return 10;
  })();
  const [showToast, setShowToast] = useState(false);

  if (isLocationVerified) return null;

  const handleConfirm = () => {
    if (orderType === 'Delivery') {
      if (!userLocation || userLocation.length < 5) {
        setHasError(true);
        return;
      }
      if (hasError) return;
    }
    
    setIsLocationVerified(true);
  };

  return (
    <AnimatePresence>
      {!isLocationVerified && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-surface-container-low border border-white/5 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-10">
              <div className="flex flex-col items-center mb-6">
                <div className="bg-primary/10 p-4 rounded-full border border-primary/20 mb-3">
                  <img src="/JBMM.png" alt="Logo" className="h-16 w-auto" />
                </div>
                <span className="font-headline text-xl font-black text-primary tracking-tight">
                  JB Mega Mart Kitchen
                </span>
              </div>

              <h2 className="text-center font-headline text-3xl font-black mb-2 tracking-tight">Select your order type</h2>
              <p className="text-center text-on-surface-variant text-sm mb-8">How would you like to receive your delicious meal?</p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <button
                  onClick={() => setOrderType('Delivery')}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl transition-all border ${orderType === 'Delivery' ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-surface-container-highest text-on-surface-variant border-transparent hover:bg-surface-bright'}`}
                >
                  <Truck className="w-8 h-8" />
                  <span className="font-bold">Delivery</span>
                </button>
                <button
                  onClick={() => setOrderType('Pickup')}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl transition-all border ${orderType === 'Pickup' ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-surface-container-highest text-on-surface-variant border-transparent hover:bg-surface-bright'}`}
                >
                  <ShoppingBag className="w-8 h-8" />
                  <span className="font-bold">Pick-Up</span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {orderType === 'Delivery' ? (
                  <motion.div
                    key="delivery-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-primary/70">
                      <MapPin className="w-3 h-3" /> Please select your location
                    </div>
                    
                    <LocationAutocomplete 
                      value={userLocation}
                      onChange={setUserLocation}
                      onError={setHasError}
                    />
                    
                    <p className="text-[10px] text-center text-on-surface-variant/50 leading-relaxed">
                      We deliver within {deliveryRadius}km of JB Mega Mart Kitchen. We'll check your address to ensure quality and freshness.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pickup-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-center py-6 bg-primary/5 rounded-3xl border border-primary/10"
                  >
                    <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold text-on-surface mb-1">JB Mega Mart, Harbanspura</h3>
                    <p className="text-xs text-on-surface-variant">Collect your order directly from our main kitchen.</p>
                  </motion.div>
                )
              }
              </AnimatePresence>

              <button
                onClick={handleConfirm}
                className="w-full mt-10 bg-primary text-on-primary py-5 rounded-full font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/30"
              >
                Start Ordering
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
