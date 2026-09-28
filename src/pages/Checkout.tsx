import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Wallet, Share2, AtSign, Plus, Minus, Trash2, MapPin, Truck, ShoppingBag, CreditCard, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { useAppContext, getProductImage } from '../context/AppContext';
import LocationModal from '../components/LocationModal';
import LocationAutocomplete from '../components/LocationAutocomplete';

export default function Checkout() {
  const { 
    cart, 
    updateQuantity, 
    updateInstructions, 
    removeFromCart, 
    placeOrder, 
    recentOrders, 
    orders,
    orderType,
    userLocation,
    setIsLocationVerified,
    setIsCartOpen,
    subcategories,
    categories
  } = useAppContext();
  const navigate = useNavigate();

  const activeOrder = (() => {
    for (const id of recentOrders) {
      const order = orders.find(o => o.id === id);
      if (order && order.status !== 'Completed') return order;
    }
    return null;
  })();

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('jb_checkout_form');
    if (saved) return JSON.parse(saved);
    
    return { 
      customerName: '', 
      customerPhone: '', 
      address: orderType === 'Pickup' ? 'Pick-Up from JB Mega Mart, Harbanspura' : userLocation,
      exactAddress: ''
    };
  });
  const [addressError, setAddressError] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '' });

  useEffect(() => {
    localStorage.setItem('jb_checkout_form', JSON.stringify(formData));
  }, [formData]);

  // Ensure page loads at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Reset payment method if switching to Delivery
  useEffect(() => {
    if (orderType === 'Delivery') {
      setPaymentMethod('COD');
    }
  }, [orderType]);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + ((item.price ?? 0) * item.quantity), 0);
  
  // Read delivery fee from admin settings
  const deliveryFeeValue = (() => {
    const saved = localStorage.getItem('jb_store_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.deliveryFee !== undefined ? settings.deliveryFee : 150;
    }
    return 150;
  })();

  // Read delivery radius from admin settings
  const deliveryRadiusValue = (() => {
    const saved = localStorage.getItem('jb_store_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.deliveryRadius !== undefined ? settings.deliveryRadius : 10;
    }
    return 10;
  })();

  const deliveryFee = (subtotal > 0 && orderType === 'Delivery') ? deliveryFeeValue : 0;
  
  // Dynamic Pakistan GST 2026: 16% for Cash, 5% for Online (Pickup option only)
  const taxRate = orderType === 'Pickup'
    ? (paymentMethod === 'Online' ? 0.05 : 0.16)
    : 0.16;
  const taxAmount = Math.round(subtotal * taxRate);
  
  const promoDiscount = subtotal > 2000 ? 400 : 0;
  const total = subtotal + deliveryFee + taxAmount - promoDiscount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = () => {
    const currentAddress = orderType === 'Pickup' ? 'Pick-Up from JB Mega Mart, Harbanspura' : userLocation;
    if (!formData.customerName || !formData.customerPhone || !currentAddress) {
      alert("Please fill in all customer details (Name, Phone, and Address).");
      return;
    }

    const phoneRegex = /^[0-9+]{10,14}$/;
    if (!phoneRegex.test(formData.customerPhone)) {
      alert("Please enter a valid phone number.");
      return;
    }
    
    if (addressError) {
      alert(`Please fix your delivery area issues (must be within ${deliveryRadiusValue}km) before ordering.`);
      return;
    }
    
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (paymentMethod === 'Online') {
      setShowPaymentModal(true);
    } else {
      processFinalOrder();
    }
  };

  const processFinalOrder = () => {
    setIsProcessing(true);
    const currentAddress = orderType === 'Pickup' ? 'Pick-Up from JB Mega Mart, Harbanspura' : userLocation;
    
    // Simulate server delay for premium feel
    setTimeout(() => {
      const orderId = placeOrder({ 
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        address: currentAddress + (formData.exactAddress ? ` | Exact: ${formData.exactAddress}` : ''),
        total, 
        paymentMethod, 
        taxAmount, 
        taxRate 
      });
      
      setFormData({
        customerName: '',
        customerPhone: '',
        address: '',
        exactAddress: ''
      });
      localStorage.removeItem('jb_checkout_form');
      setIsProcessing(false);
      navigate(`/order-confirmation/${orderId}`);
    }, 2000);
  };

  return (
    <>
      <LocationModal />
      
      {/* Payment Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-2xl">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-black italic mb-2">Securing Your Feast</h2>
            <p className="text-on-surface-variant text-sm uppercase tracking-widest font-bold animate-pulse">Verifying Payment Gateway...</p>
          </div>
        </div>
      )}

      {/* Mock Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl">
          <div className="bg-surface-container-low border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">Secure Payment</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black">256-bit Encryption</p>
                  </div>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-3xl text-on-primary shadow-lg mb-8 h-48 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <CreditCard className="w-10 h-10 opacity-50" />
                    <span className="font-black italic text-lg tracking-tighter">JB KITCHEN PREMIER</span>
                  </div>
                  <div>
                    <p className="text-xs opacity-60 uppercase tracking-widest mb-1">Card Number</p>
                    <p className="text-xl font-mono tracking-widest">{cardData.number || '•••• •••• •••• ••••'}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] opacity-60 uppercase tracking-widest mb-1">Expires</p>
                      <p className="text-sm font-bold">{cardData.expiry || 'MM/YY'}</p>
                    </div>
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-[10px] font-black italic">
                      VISA
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-primary mb-2 block">Card Number</label>
                    <input 
                      type="text" 
                      maxLength={19}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary font-mono"
                      value={cardData.number}
                      onChange={(e) => setCardData(p => ({ ...p, number: e.target.value.replace(/[^\d ]/g, '') }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-primary mb-2 block">Expiry Date</label>
                      <input 
                        type="text" 
                        maxLength={5}
                        placeholder="MM/YY"
                        className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary font-mono"
                        value={cardData.expiry}
                        onChange={(e) => setCardData(p => ({ ...p, expiry: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-primary mb-2 block">CVC</label>
                      <input 
                        type="password" 
                        maxLength={3}
                        placeholder="•••"
                        className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary font-mono"
                        value={cardData.cvc}
                        onChange={(e) => setCardData(p => ({ ...p, cvc: e.target.value.replace(/[^\d]/g, '') }))}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowPaymentModal(false);
                    processFinalOrder();
                  }}
                  className="w-full bg-primary text-on-primary py-5 rounded-full font-black text-lg shadow-xl shadow-primary/20 mt-4 active:scale-95 transition-all"
                >
                  Pay Rs. {total} Now
                </button>
                <p className="text-[8px] text-center text-on-surface-variant/40 uppercase tracking-widest leading-relaxed">
                  By clicking Pay Now, you authorize JB Mega Mart Kitchen to process this transaction through our secure gateway.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-background text-on-background selection:bg-primary selection:text-on-primary min-h-screen">
      {/* TopNavBar */}
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#131313]/85 backdrop-blur-[32px] flex justify-between items-center px-4 sm:px-6 md:px-10 h-20 md:h-24 shadow-[0_40px_60px_rgba(229,226,225,0.05)]">
        <Link to="/" className="flex items-center gap-2 sm:gap-4 md:gap-5">
          <img src="/JBMM.png" alt="JBMM Logo" className="h-12 sm:h-16 md:h-20 w-auto object-contain" />
          <span className="hidden lg:block text-2xl font-black text-primary italic font-headline tracking-tight">
            JB Mega Mart Kitchen
          </span>
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          {activeOrder && (
            <Link to={`/track-order/${activeOrder.id}`} className="text-[#e5e2e1]/60 font-medium font-headline hover:text-primary transition-all duration-300">Track Order</Link>
          )}
          <Link to="/#menu" className="text-[#e5e2e1]/60 font-medium font-headline hover:text-primary transition-all duration-300">Menu</Link>
          <a className="text-[#e5e2e1]/60 font-medium font-headline hover:text-primary transition-all duration-300">Specials</a>
          <a className="text-[#e5e2e1]/60 font-medium font-headline hover:text-primary transition-all duration-300">About</a>
          <Link to="/checkout" className="text-primary font-bold border-b-2 border-primary pb-1 font-headline">Order</Link>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-4 md:gap-5">
          <button 
            onClick={() => setIsLocationVerified(false)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-surface-container-highest border border-white/5 hover:bg-surface-bright transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary shrink-0 max-w-[130px] sm:max-w-none truncate"
          >
            {orderType === 'Delivery' ? (
              <><Truck className="w-3 h-3 shrink-0" /> <span className="truncate">{userLocation ? `${userLocation.substring(0, 10)}...` : 'Delivery'}</span></>
            ) : (
              <><ShoppingBag className="w-3 h-3 shrink-0" /> Pickup</>
            )}
          </button>
          <Link 
            to="/checkout" 
            onClick={(e) => {
              if (window.innerWidth >= 768) {
                e.preventDefault();
                setIsCartOpen(true);
              }
            }}
            className="text-primary active:scale-95 transition-transform cursor-pointer relative p-1"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-on-primary text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      <main className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-12">
          <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-black text-on-surface tracking-tighter italic">
            Checkout<span className="text-primary">.</span>
          </h1>
          <p className="font-body text-secondary mt-3 sm:mt-4 max-w-lg text-sm sm:text-base">Finalize your delicious selection and prepare for a premium culinary experience delivered to your doorstep.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Forms */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Customer Information */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <span className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">01</span>
                <h2 className="font-headline text-2xl font-bold text-on-surface">Customer Information</h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="text-xs uppercase tracking-widest text-primary mb-2 block font-bold">Full Name</label>
                    <input 
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/30" 
                      placeholder="Muhammad Ali" 
                      type="text" 
                    />
                  </div>
                  <div className="relative">
                    <label className="text-xs uppercase tracking-widest text-primary mb-2 block font-bold">Phone Number</label>
                    <input 
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/30" 
                      placeholder="0323 888 7892" 
                      type="tel" 
                    />
                  </div>
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs uppercase tracking-widest text-primary font-bold">
                      {orderType === 'Delivery' ? 'Verified Delivery Address' : 'Pick-Up Location'}
                    </label>
                    {orderType === 'Delivery' && (
                      <button 
                        onClick={() => setIsLocationVerified(false)}
                        className="text-[10px] font-black uppercase tracking-widest text-primary/50 hover:text-primary transition-colors"
                      >
                        Change Address
                      </button>
                    )}
                  </div>
                  
                  {orderType === 'Delivery' ? (
                    <div className="w-full bg-surface-container-highest rounded-2xl p-5 border border-white/5 flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface leading-tight">{userLocation}</p>
                        {orderType === 'Delivery' && (
                          <textarea
                            value={formData.exactAddress}
                            onChange={(e) => setFormData({...formData, exactAddress: e.target.value})}
                            className="w-full mt-3 bg-surface-container/50 border border-outline-variant/10 rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/30"
                            placeholder="Write your exact address here (House no, Street no, Floor etc.)"
                            rows={2}
                          />
                        )}
                        <p className="text-[10px] text-primary uppercase tracking-widest font-black mt-1">Verified Delivery Zone</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-surface-container-highest rounded-2xl p-5 border border-primary/20 flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">JB Mega Mart, Harbanspura</p>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black">Self Collection</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <span className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">02</span>
                <h2 className="font-headline text-2xl font-bold text-on-surface">Payment Method</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderType === 'Pickup' ? (
                  <>
                    {/* Pickup Cash Option (16% GST) */}
                    <div 
                      onClick={() => setPaymentMethod('COD')}
                      className={`glass-card p-6 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 ${paymentMethod === 'COD' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-outline-variant/15 hover:bg-surface-bright'}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === 'COD' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface">Cash Payment</h3>
                        <p className="text-[10px] text-secondary/60 uppercase tracking-widest font-black">GST 16% • Pay at Counter</p>
                      </div>
                    </div>

                    {/* Pickup Card Option (5% GST) */}
                    <div 
                      onClick={() => setPaymentMethod('Online')}
                      className={`glass-card p-6 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 ${paymentMethod === 'Online' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-outline-variant/15 hover:bg-surface-bright'}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === 'Online' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface">Card Payment</h3>
                        <p className="text-[10px] text-secondary/60 uppercase tracking-widest font-black">GST 5% • Secure Pay Now</p>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Delivery Cash on Delivery Option (16% GST) */
                  <div 
                    onClick={() => setPaymentMethod('COD')}
                    className="glass-card p-6 rounded-3xl border border-primary bg-primary/5 ring-1 ring-primary flex items-center gap-4 md:col-span-2"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-on-primary">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface">Cash on Delivery</h3>
                      <p className="text-[10px] text-secondary/60 uppercase tracking-widest font-black">GST 16% • Pay at Doorstep</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Image Break */}
            <div className="w-full h-64 rounded-full overflow-hidden relative mt-12">
              <img alt="Premium food arrangement" className="w-full h-full object-cover grayscale opacity-40 hover:grayscale-0 transition-all duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCn8I3BNulaT1M1HrTlARKl1sP-w-E0sV2UZLYELibUM61YV6vQlKVRS0xdIBlSAdaSNcNfLahyTKIGGRirvK56ekJ0oP8RFLjaF_AqcPv0iUWFbMulQ89ccbd2g0Y0z_jKhyeIjmXKF73v8O0U0yqu8E_C0yGbZwMbEARzNGKFTuKtUEdlHrZkXQ0N0OXlQ7SLljtpovaQhR1PExDDWYG8DNnj8UuHrxecyhSVFBUbIKXKlLHzzdHA8DNLkg-gURYD044kZbjurq_M" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="glass-card rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8 sticky top-24 sm:top-32 shadow-2xl shadow-black/50 overflow-hidden relative">
              {/* Liquid Glow Accent */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full"></div>
              
              <h2 className="font-headline text-2xl sm:text-3xl font-black mb-6 sm:mb-8 italic flex items-center justify-between">
                <div>Your Order <span className="text-xs font-normal not-italic ml-2 px-3 py-1 bg-primary text-on-primary rounded-full">{cartItemCount} Items</span></div>
              </h2>

              <div className="space-y-6 mb-10 max-h-[50vh] overflow-y-auto no-scrollbar pr-2">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto text-on-surface-variant/30 mb-4" />
                    <p className="text-on-surface-variant">Your cart is currently empty.</p>
                    <Link to="/#menu">
                      <button className="mt-4 text-primary font-bold text-sm uppercase tracking-widest hover:underline">Explore Menu</button>
                    </Link>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 sm:gap-4 group">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img alt={item.name} className="w-full h-full object-cover" src={getProductImage(item, subcategories, categories)} />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-on-surface leading-tight text-sm sm:text-base">{item.name}</h4>
                            {item.subcategoryIds && item.subcategoryIds.length > 0 && (() => {
                              const selected = subcategories.filter(s => item.subcategoryIds!.includes(s.id));
                              return selected.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {selected.map(s => (
                                    <span key={s.id} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                      {s.name}
                                    </span>
                                  ))}
                                </div>
                              ) : null;
                            })()}
                          </div>
                          <span className="text-primary font-headline font-bold text-sm sm:text-base whitespace-nowrap ml-2 sm:ml-4">Rs. {(item.price ?? 0) * item.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-secondary/50">
                            {item.variant ? `Variant: ${item.variant}` : `Qty: ${String(item.quantity).padStart(2, '0')}`}
                          </p>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeFromCart(item.id)} className="ml-2 text-error hover:text-error/80 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <input 
                            type="text" 
                            placeholder="Special instructions (e.g. no onions)"
                            value={item.instructions || ''}
                            onChange={(e) => updateInstructions(item.id, e.target.value)}
                            className="w-full bg-surface-container-highest/50 border-none rounded-lg p-2 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary/60">Subtotal</span>
                  <span className="text-on-surface font-medium">Rs. {subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary/60">Delivery Fee</span>
                  <span className="text-on-surface font-medium">Rs. {deliveryFee}</span>
                </div>
                <div className="flex justify-between text-sm group relative">
                  <div className="flex items-center gap-1">
                    <span className="text-secondary/60 font-medium underline decoration-primary/20 decoration-dashed">GST ({Math.round(taxRate * 100)}%)</span>
                    {paymentMethod === 'Online' && (
                      <span className="text-[8px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-black border border-green-500/20">Digital Incentive</span>
                    )}
                  </div>
                  <span className="text-on-surface font-medium">Rs. {taxAmount}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-tertiary">Promotional Discount</span>
                    <span className="text-tertiary font-bold">- Rs. {promoDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4">
                  <span className="font-headline text-xl font-bold">Total</span>
                  <span className="font-headline text-3xl font-black text-primary">Rs. {total}</span>
                </div>
              </div>

              {/* Active Order Lock Message */}
                  <button 
                    onClick={handleSubmitOrder}
                    disabled={cart.length === 0 || isProcessing}
                    className={`w-full mt-10 text-on-primary py-5 rounded-full font-black text-lg tracking-widest uppercase transition-all duration-300 shadow-xl ${cart.length > 0 && !isProcessing ? 'bg-primary hover:bg-white hover:text-black active:scale-95 shadow-primary/20 cursor-pointer' : 'bg-surface-container-highest text-on-surface/30 cursor-not-allowed shadow-none'}`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <span>Place Order</span>
                    )}
                  </button>
              <p className="text-[10px] text-center mt-6 text-secondary/40 uppercase tracking-[0.2em]">
                Secure checkout powered by Culinary Noir Systems
              </p>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1c1b1b] w-full py-16 px-6 md:px-10 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
          <div>
            <span className="font-headline text-primary font-black text-2xl mb-4 block">JB Mega Mart Kitchen</span>
            <p className="font-body text-sm leading-relaxed text-[#e5e2e1]/60">
              A premium culinary destination where luxury meets flavor. Every dish is a masterpiece designed to ignite your senses.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Link to="/#menu" className="text-[#e5e2e1]/60 text-sm hover:text-primary transition-colors">Menu</Link>
              <a className="text-[#e5e2e1]/60 text-sm hover:text-primary transition-colors">Specials</a>
              <a className="text-[#e5e2e1]/60 text-sm hover:text-primary transition-colors">About</a>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/checkout" className="text-[#e5e2e1]/60 text-sm hover:text-primary transition-colors">Order</Link>
              <a className="text-[#e5e2e1]/60 text-sm hover:text-primary transition-colors">Privacy</a>
              <a className="text-[#e5e2e1]/60 text-sm hover:text-primary transition-colors">Support</a>
            </div>
          </div>
          <div>
            <p className="font-body text-sm leading-relaxed text-[#e5e2e1]/60">
              © 2026 JB Mega Mart Kitchen. <br />
              JB Mega Mart, Foji Foundation Road, Lahore. <br />
              Tel: 03238887892
            </p>
            <div className="flex gap-4 mt-6">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary group cursor-pointer transition-all hover:bg-primary hover:text-on-primary">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary group cursor-pointer transition-all hover:bg-primary hover:text-on-primary">
                <AtSign className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
