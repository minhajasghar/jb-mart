import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, ArrowRight, Utensils, Salad, Phone, MapPin, Clock, Facebook, Share2, Send, Plus, Minus, AlertCircle, Truck, ShoppingBag, Star, X, ChevronRight, ChevronDown } from 'lucide-react';
import { useAppContext, type Product, type Category, type Subcategory } from '../context/AppContext';
import LocationModal from '../components/LocationModal';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const SeamlessYouTubeLoop = ({ videoId }: { videoId: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const loadPlayer = () => {
      if (!containerRef.current) return;
      
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          mute: 1,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          iv_load_policy: 3,
          origin: window.location.origin
        },
        events: {
          onReady: (e: any) => {
            e.target.mute();
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              e.target.playVideo();
            }
          }
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
         firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
         document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = loadPlayer;
    } else if (window.YT && window.YT.Player) {
      loadPlayer();
    }

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        const time = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        if (duration > 0 && time >= duration - 0.4) {
          playerRef.current.seekTo(0, true);
        }
      }
    }, 150);

    return () => {
      clearInterval(interval);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  return (
    <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] pointer-events-none -translate-x-1/2 -translate-y-1/2">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default function Landing() {
  const { cart, addToCart, updateQuantity, products, categories, subcategories, recentOrders, orders, orderType, userLocation, setIsLocationVerified, setIsCartOpen } = useAppContext();
  
  const dynamicCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    image: cat.image,
    items: products.filter(p => p.categoryId === cat.id).map(p => p.id)
  }));

  const categoryCounts = dynamicCategories.map(cat => {
    const count = cat.items
      .map(id => products.find(p => p.id === id))
      .filter(p => p !== undefined && !p.isOutOfStock)
      .length;
    return { ...cat, count };
  }).filter(cat => cat.count > 0);

  const [activeCategory, setActiveCategory] = useState(categoryCounts[0]?.id || '');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-120px 0px -60% 0px',
        threshold: 0
      }
    );

    const targets = dynamicCategories.map(cat => document.getElementById(cat.id)).filter(Boolean);
    targets.forEach(t => observer.observe(t!));

    return () => {
      targets.forEach(t => observer.unobserve(t!));
    };
  }, [products]);

  useEffect(() => {
    if (activeCategory && scrollContainerRef.current) {
      const activeBtn = scrollContainerRef.current.querySelector(`[data-category-id="${activeCategory}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeCategory]);

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 170; // 96px header + 58px category menu + padding
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveCategory(id);
    }
  };

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<{type: 'success' | 'error' | '', message: string}>({type: '', message: ''});
  const [activeLegalModal, setActiveLegalModal] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNewsletterStatus({ type: 'success', message: 'Thank you for subscribing!' });
        setNewsletterEmail('');
      } else {
        setNewsletterStatus({ type: 'error', message: data.error || 'Failed to subscribe' });
      }
    } catch (error) {
      setNewsletterStatus({ type: 'error', message: 'Server error. Please try again later.' });
    }
  };

  const location = useLocation();

  const activeOrder = (() => {
    for (const id of recentOrders) {
      const order = orders.find(o => o.id === id);
      if (order && order.status !== 'Completed') return order;
    }
    return null;
  })();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (location.pathname === '/' && location.hash === '') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);
  
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  const toggleSubcategory = (id: string) => {
    setExpandedSubcategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getQty = (id: string) => cart.find(item => item.id === id)?.quantity || 0;

  const renderCartControl = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    if (product.isOutOfStock) {
      return (
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/50 flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-full border border-primary/10">
          <AlertCircle className="w-3 h-3" /> Sold Out
        </span>
      );
    }

    const qty = getQty(product.id);
    if (qty > 0) {
      return (
        <div className="flex items-center gap-2 bg-surface-container-highest rounded-full p-1 border border-primary/20 shadow-inner shrink-0">
          <button onClick={() => updateQuantity(product.id, -1)} className="w-6 h-6 rounded-full bg-background text-on-surface flex justify-center items-center hover:bg-primary hover:text-on-primary transition-colors active:scale-95"><Minus className="w-3 h-3"/></button>
          <span className="text-primary font-bold text-xs w-4 text-center select-none">{qty}</span>
          <button onClick={() => updateQuantity(product.id, 1)} className="w-6 h-6 rounded-full bg-background text-on-surface flex justify-center items-center hover:bg-primary hover:text-on-primary transition-colors active:scale-95"><Plus className="w-3 h-3"/></button>
        </div>
      );
    }
    return (
      <button onClick={() => addToCart(product)} className="w-8 h-8 rounded-full bg-primary/20 text-primary flex justify-center items-center hover:bg-primary hover:text-on-primary transition-colors active:scale-95 shrink-0">
        <Plus className="w-4 h-4"/>
      </button>
    );
  };

  const getProduct = (id: string) => products.find(p => p.id === id) || { name: 'Unknown', price: 0, isOutOfStock: false };

  return (
    <div className="bg-background text-on-background font-body selection:bg-primary selection:text-on-primary">
      <LocationModal />
      {activeLegalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setActiveLegalModal(null)} />
          <div className="relative bg-surface-container-low border border-white/5 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden p-10">
            <button onClick={() => setActiveLegalModal(null)} className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="font-headline text-3xl font-black mb-4 tracking-tight text-primary">{activeLegalModal} Policy</h2>
            <div className="text-on-surface-variant text-sm space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {activeLegalModal === 'Privacy' && (
                <>
                  <p>At JB Mega Mart Kitchen, we value your privacy. This policy explains how we collect and use your data.</p>
                  <p><strong>Information We Collect:</strong> We collect your name, phone number, and address solely to process and deliver your orders.</p>
                  <p><strong>Data Security:</strong> Your information is stored securely and never shared with third parties for marketing purposes.</p>
                  <p><strong>Cookies:</strong> We use local browser storage to remember your cart and recent orders for a better experience.</p>
                </>
              )}
              {activeLegalModal === 'Terms' && (
                <>
                  <p>By using our website, you agree to the following terms and conditions.</p>
                  <p><strong>Ordering:</strong> All orders are subject to availability. We reserve the right to cancel orders if items are out of stock.</p>
                  <p><strong>Delivery:</strong> Delivery is only available within our specified radius. Times are estimates and may vary.</p>
                  <p><strong>Payment:</strong> We accept Cash on Delivery and online payments. All sales are final once prepared.</p>
                </>
              )}
              {activeLegalModal === 'Safety' && (
                <>
                  <p>Your safety and health are our top priorities.</p>
                  <p><strong>Hygiene:</strong> Our kitchen follows strict international hygiene standards. All staff wear protective gear.</p>
                  <p><strong>Contactless Delivery:</strong> We offer contactless delivery upon request. Just leave a note in the address field.</p>
                  <p><strong>Allergens:</strong> Please notify us of any food allergies in the special instructions box when adding items to cart.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed top-0 z-50 bg-[#131313]/85 backdrop-blur-[32px] flex justify-between items-center px-4 sm:px-6 md:px-10 h-20 md:h-24 w-full shadow-[0_40px_60px_rgba(229,226,225,0.05)]">
        <Link to="/" className="flex items-center gap-2 sm:gap-4 md:gap-5">
          <img src="/JBMM.png" alt="JB Mega Mart Kitchen" className="h-12 sm:h-16 md:h-20 w-auto object-contain" />
          <span className="hidden lg:block text-2xl font-black text-primary italic font-headline tracking-tight">
            JB Mega Mart Kitchen
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-headline tracking-tight">
          <Link to="/#menu" className="text-primary font-bold border-b-2 border-primary pb-1 hover:text-primary transition-all duration-300 active:scale-95 cursor-pointer">Menu</Link>
          <Link to="/#specials" className="text-[#e5e2e1] font-medium hover:text-primary transition-all duration-300 active:scale-95 cursor-pointer">Specials</Link>
          <Link to="/#about" className="text-[#e5e2e1] font-medium hover:text-primary transition-all duration-300 active:scale-95 cursor-pointer">About</Link>
          {activeOrder && (
            <Link to={`/track-order/${activeOrder.id}`} className="text-[#e5e2e1] font-medium hover:text-primary transition-all duration-300 active:scale-95 cursor-pointer">Track Order</Link>
          )}
          <Link to="/checkout" className="text-[#e5e2e1] font-medium hover:text-primary transition-all duration-300 active:scale-95 cursor-pointer">Order</Link>
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
      <main className="pt-20 md:pt-24">
        <section className="relative h-auto lg:h-[85vh] lg:min-h-[600px] flex items-center overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 lg:py-0">
          <div className="absolute inset-0 z-0 bg-background pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -translate-y-1/2"></div>
            <div className="absolute -top-32 right-10 w-96 h-96 bg-[#e5e2e1]/5 blur-[100px] rounded-full"></div>
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 md:px-12 relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            <div className="lg:col-span-5 max-w-2xl z-20">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-headline font-black text-on-background leading-[1.05] sm:leading-[0.9] mb-4 sm:mb-6">
                Shop <span className="text-primary italic">Smart.</span><br/>Live Better.
              </h1>
              <p className="text-base sm:text-xl md:text-2xl text-on-surface-variant font-medium mb-6 sm:mb-10 max-w-lg leading-relaxed">
                Experience the fusion of high-end grocery shopping and premium culinary craftsmanship.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <Link to="/checkout" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-primary text-on-primary px-8 py-3.5 sm:px-10 sm:py-5 rounded-full font-bold text-base sm:text-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_20px_40px_rgba(185,29,29,0.3)]">
                    Order Now
                  </button>
                </Link>
                <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto bg-surface-container-highest text-on-surface px-8 py-3.5 sm:px-10 sm:py-5 rounded-full font-bold text-base sm:text-lg hover:bg-surface-bright active:scale-95 transition-colors glass-effect">
                  Explore Menu
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 relative w-full lg:w-[125%] lg:-ml-[5%] xl:-ml-[10%] aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(185,29,29,0.2)] bg-background z-10">
              <SeamlessYouTubeLoop videoId="lUhMx_1fcsI" />
              <div 
                className="absolute inset-0 pointer-events-none z-20 rounded-2xl sm:rounded-3xl"
                style={{
                  boxShadow: 'inset 0 0 80px 25px rgba(19, 19, 19, 1)'
                }}
              ></div>
              <div className="absolute inset-0 bg-primary/10 mix-blend-color z-30 rounded-2xl sm:rounded-3xl"></div>
              <div className="absolute inset-0 z-40 bg-transparent rounded-2xl sm:rounded-3xl"></div>
            </div>
          </div>
        </section>
        <section id="menu" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-16 gap-4 sm:gap-6">
            <div>
              <h2 className="text-primary font-headline text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-2 sm:mb-4">Our Selection</h2>
              <h3 className="text-3xl sm:text-4xl md:text-6xl font-headline font-extrabold">The Master Menu</h3>
            </div>
            <p className="text-on-surface-variant max-w-xs text-left md:text-right italic font-medium text-xs sm:text-sm">Curated ingredients met with precise culinary techniques.</p>
          </div>
          {/* Scrollable Mobile Category Menu */}
          <div className="md:hidden sticky top-20 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/95 backdrop-blur-md border-b border-white/5 overflow-hidden">
            <div 
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5 scroll-smooth"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {categoryCounts.map(cat => (
                <button
                  key={cat.id}
                  data-category-id={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`rounded-full px-3.5 py-2 text-xs font-headline font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap active:scale-95 border shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20'
                      : 'bg-surface-container-low text-[#e5e2e1]/60 border-white/5 hover:text-primary'
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {categories.filter(cat => products.some(p => p.categoryId === cat.id && !p.isOutOfStock)).map(cat => {
              const catSubs = subcategories.filter(s => s.categoryId === cat.id).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
              if (catSubs.length > 0) {
                const subcatSections = catSubs.map(sc => {
                  const scProducts = products.filter(p => p.subcategoryId === sc.id && !p.isOutOfStock);
                  return scProducts.length > 0 ? { subcategory: sc, products: scProducts } : null;
                }).filter(Boolean);
                const orphanProducts = products.filter(p => p.categoryId === cat.id && !p.subcategoryId && !p.isOutOfStock);
                if (subcatSections.length === 0 && orphanProducts.length === 0) return null;
                const isCompact = ['category-next-cola', 'category-pepsi', 'category-coke'].includes(cat.id);
                return (
                  <div key={cat.id} id={cat.id} className="md:col-span-12 bg-surface-container-low rounded-[2rem] overflow-hidden scroll-mt-32">
                    <div className="flex flex-col md:flex-row">
                      {cat.image && !isCompact && (
                        <div className="md:w-1/3 relative overflow-hidden min-h-[200px]">
                          <img className="w-full h-full object-cover rounded-[2rem]" alt={cat.name} src={cat.image} />
                        </div>
                      )}
                      <div className={`${isCompact ? 'p-0' : 'p-4 sm:p-6 md:p-8'} flex-1 flex flex-col`}>
                        {isCompact ? (
                          <div className="flex flex-col sm:flex-row">
                            {cat.image && (
                              <div className="w-28 h-28 sm:w-40 sm:h-40 flex-shrink-0 self-center m-2 sm:ml-1 overflow-hidden rounded-xl">
                                <img className="w-full h-full object-cover" alt="" src={cat.image} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 p-3 sm:p-2 sm:pl-3">
                              <h4 className="font-headline font-bold text-3xl mb-3">{cat.name}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                {(subcatSections as { subcategory: Subcategory; products: Product[] }[]).map(({ subcategory: sc, products: scProducts }) => {
                                  const isExpanded = expandedSubcategories.has(sc.id);
                                  const hideImage = cat.id === 'category-pizza' || cat.id === 'category-cakes';
                                  return (
                                    <div key={sc.id}>
                                      <div className={`flex items-center rounded-lg overflow-hidden border transition-all duration-200 ${
                                        isExpanded
                                          ? 'border-primary bg-primary/5'
                                          : 'border-white/5 bg-surface-container-highest/30 hover:bg-surface-container-highest/50 hover:border-white/10'
                                      }`}>
                                        {!hideImage && (
                                          <div className="relative w-14 h-14 flex-shrink-0 overflow-hidden bg-surface-container-highest">
                                            {sc.image ? (
                                              <img src={sc.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center bg-surface-container-highest">
                                                <span className="font-bold text-base text-on-surface-variant/20">{sc.name[0]}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        <div className="flex-1 flex items-center justify-between px-5 py-4">
                                          {(hideImage || isCompact) && (
                                            <span className={`text-on-surface font-bold ${isCompact ? 'text-base' : 'text-sm'}`}>{sc.name}</span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => toggleSubcategory(sc.id)}
                                            className="p-1 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container-highest"
                                          >
                                            <ChevronDown className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} w-4 h-4`} />
                                          </button>
                                        </div>
                                      </div>
                                      {isExpanded && (
                                        <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-1">
                                          {scProducts.map(p => (
                                            <div key={p.id} className="bg-surface-container/50 px-2 py-1.5 rounded-xl flex flex-col gap-1 group/item hover:bg-surface-container-higher transition-colors">
                                              <div className="flex items-start justify-between gap-1">
                                                <span className="text-on-surface font-bold text-[10px] leading-tight flex-1">{p.name}{p.variant ? <span className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1">{p.variant}</span> : null}</span>
                                                <div className="flex-shrink-0">{renderCartControl(p.id)}</div>
                                              </div>
                                              <span className="text-primary font-black text-xs">Rs. {p.price}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {orphanProducts.length > 0 && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                  {orphanProducts.map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-surface-container/50 px-4 py-3 rounded-xl group/item hover:bg-surface-container-highest transition-colors">
                                      <div>
                                        <span className="text-on-surface font-bold text-sm">{p.name}{p.variant ? <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">{p.variant}</span> : null}</span>
                                        <div className="text-primary font-black text-sm">Rs. {p.price}</div>
                                      </div>
                                      {renderCartControl(p.id)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-headline font-bold text-2xl mb-6">{cat.name}</h4>
                            <div className="flex-1 flex flex-col justify-center">
                            <div className="space-y-3 mb-6">
                              {(subcatSections as { subcategory: Subcategory; products: Product[] }[]).map(({ subcategory: sc, products: scProducts }) => {
                                const isExpanded = expandedSubcategories.has(sc.id);
                                const hideImage = cat.id === 'category-pizza' || cat.id === 'category-cakes';
                                return (
                                  <div key={sc.id}>
                                    <div className={`flex items-center rounded-xl overflow-hidden border transition-all duration-200 ${
                                      isExpanded
                                        ? 'border-primary bg-primary/5'
                                        : 'border-white/5 bg-surface-container-highest/30 hover:bg-surface-container-highest/50 hover:border-white/10'
                                    }`}>
                                      {!hideImage && (
                                        <div className="relative w-24 h-24 sm:w-36 sm:h-36 flex-shrink-0 overflow-hidden bg-surface-container-highest">
                                          {sc.image ? (
                                            <img src={sc.image} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-surface-container-highest">
                                              <span className="text-2xl sm:text-3xl font-bold text-on-surface-variant/20">{sc.name[0]}</span>
                                            </div>
                                          )}
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                          <span className="absolute bottom-1.5 left-2 sm:bottom-2 sm:left-2.5 text-white font-bold text-xs sm:text-sm drop-shadow-md leading-tight">{sc.name}</span>
                                        </div>
                                      )}
                                      <div className="flex-1 flex items-center justify-between px-3 py-2.5 sm:px-5 sm:py-4">
                                        {hideImage && (
                                          <span className="text-on-surface font-bold text-base">{sc.name}</span>
                                        )}
                                        <span className="text-sm text-on-surface-variant/50 font-medium ml-auto mr-3">{scProducts.length} item{scProducts.length !== 1 ? 's' : ''}</span>
                                        <button
                                          type="button"
                                          onClick={() => toggleSubcategory(sc.id)}
                                          className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container-highest"
                                        >
                                          <ChevronDown className={`w-6 h-6 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                      </div>
                                    </div>
                                    {isExpanded && (
                                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                                        {scProducts.map(p => (
                                          <div key={p.id} className="bg-surface-container/50 px-4 py-3 rounded-xl flex flex-col gap-1.5 group/item hover:bg-surface-container-higher transition-colors">
                                            <div className="flex items-start justify-between gap-1">
                                              <span className="text-on-surface font-bold text-sm leading-tight flex-1">{p.name}{p.variant ? <span className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1">{p.variant}</span> : null}</span>
                                              <div className="flex-shrink-0">{renderCartControl(p.id)}</div>
                                            </div>
                                            <span className="text-primary font-black text-sm">Rs. {p.price}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                              {orphanProducts.length > 0 && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                  {orphanProducts.map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-surface-container/50 px-4 py-3 rounded-xl group/item hover:bg-surface-container-highest transition-colors">
                                      <div>
                                        <span className="text-on-surface font-bold text-sm">{p.name}{p.variant ? <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">{p.variant}</span> : null}</span>
                                        <div className="text-primary font-black text-sm">Rs. {p.price}</div>
                                      </div>
                                      {renderCartControl(p.id)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              const catProducts = products.filter(p => p.categoryId === cat.id && !p.isOutOfStock);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id} id={cat.id} className="md:col-span-12 bg-surface-container-low rounded-[2rem] overflow-hidden scroll-mt-32">
                  <div className={`flex flex-col md:flex-row ${cat.image ? 'h-full' : 'p-4 sm:p-6 md:p-8'}`}>
                    {cat.image && (
                      <div className="md:w-1/3 relative overflow-hidden min-h-[200px]">
                        <img className="w-full h-full object-cover rounded-2xl md:rounded-[2rem]" alt={cat.name} src={cat.image} />
                      </div>
                    )}
                    <div className={`${cat.image ? 'md:w-2/3 p-4 sm:p-6 md:p-8' : ''} flex flex-col`}>
                      <h4 className="text-xl sm:text-2xl font-headline font-bold mb-3 sm:mb-4">{cat.name}</h4>
                      <div className="flex-1 flex flex-col justify-center">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {catProducts.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-surface-container/50 p-4 rounded-xl group/item hover:bg-surface-container-highest transition-colors">
                        <div>
                          <span className="text-on-surface font-bold">{p.name}{p.variant ? <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">{p.variant}</span> : null}</span>
                          <div className="text-primary font-black">Rs. {p.price}</div>
                        </div>
                        {renderCartControl(p.id)}
                      </div>
                    ))}
                  </div>
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
            {(() => {
              const uncategorized = products.filter(p => (!p.categoryId || !categories.some(c => c.id === p.categoryId)) && !p.isOutOfStock);
              if (uncategorized.length === 0) return null;
              return (
                <div className="md:col-span-12 bg-surface-container-low rounded-2xl md:rounded-[2rem] overflow-hidden scroll-mt-32 p-4 sm:p-6 md:p-8">
                  <h4 className="text-xl sm:text-2xl font-headline font-bold mb-3 sm:mb-4">Other Items</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {uncategorized.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-surface-container/50 p-4 rounded-xl group/item hover:bg-surface-container-highest transition-colors">
                        <div>
                          <span className="text-on-surface font-bold">{p.name}{p.variant ? <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">{p.variant}</span> : null}</span>
                          <div className="text-primary font-black">Rs. {p.price}</div>
                        </div>
                        {renderCartControl(p.id)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        <section id="specials" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-primary font-headline text-sm font-bold tracking-[0.2em] uppercase mb-4">Chef's Recommendations</h2>
            <h3 className="text-4xl md:text-6xl font-headline font-extrabold">Today's Specials</h3>
            <p className="text-on-surface-variant mt-4 max-w-2xl mx-auto">This section is currently being updated. Check back soon for exclusive daily specials curated by our head chef.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.filter(p => p.isSpecial && !p.isOutOfStock).length > 0 ? (
              products.filter(p => p.isSpecial && !p.isOutOfStock).map(p => (
                <div key={p.id} className="bg-surface-container-low rounded-[2rem] overflow-hidden group border border-white/5 shadow-xl">
                  <div className="h-48 relative overflow-hidden">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={p.name} 
                      src={
                        p.name.toLowerCase().includes('burger') || p.id.includes('zinger') ? '/burgerr.jpeg' :
                        p.name.toLowerCase().includes('sandwich') ? '/sandwich.jpeg' :
                        p.name.toLowerCase().includes('shawarma') || p.name.toLowerCase().includes('wrap') ? '/shawarma.jpeg' :
                        p.name.toLowerCase().includes('pizza') ? '/Pizza.png' :
                        p.name.toLowerCase().includes('fries') ? '/Fries.png' :
                        p.name.toLowerCase().includes('salad') ? '/salad.jpeg' :
                        p.name.toLowerCase().includes('cake') ? '/Cakes.png' :
                        p.name.toLowerCase().includes('cupcake') ? '/Muffins.jpeg' :
                        p.name.toLowerCase().includes('pastry') ? '/Pastries.jpeg' :
                        p.name.toLowerCase().includes('donut') || p.name.toLowerCase().includes('cream roll') ? '/Donuts-Cream-rolls.png' :
                        p.name.toLowerCase().includes('bakar') ? '/Bakarkhani.jpeg' :
                        p.name.toLowerCase().includes('khatai') || p.name.toLowerCase().includes('biscuit') || p.name.toLowerCase().includes('rusk') ? '/Cookies-Buscuits.png' :
                        p.image || '/sandwich.jpeg'
                      } 
                    />
                    <div className="absolute top-4 right-4 bg-amber-500 text-on-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Special
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold mb-2">{p.name}</h4>
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-primary font-black text-xl">Rs. {p.price}</div>
                      <button 
                        onClick={() => addToCart(p)}
                        className="bg-surface-container-highest text-on-surface p-2 rounded-full hover:bg-primary hover:text-on-primary transition-colors"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full h-64 rounded-[2rem] border-2 border-dashed border-primary/20 flex items-center justify-center">
                <p className="text-on-surface-variant/50 font-medium">No specials added yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        <section id="about" className="py-24 bg-surface-container-low/50">
          <div className="container mx-auto px-6 md:px-12 text-center max-w-4xl">
            <h2 className="text-primary font-headline text-sm font-bold tracking-[0.2em] uppercase mb-4">Our Story</h2>
            <h3 className="text-4xl md:text-6xl font-headline font-extrabold mb-8">About Us</h3>
            <p className="text-xl text-on-surface-variant leading-relaxed">
              Welcome to <strong>JB Mega Mart Kitchen</strong>, where passion meets flavor! We are dedicated to bringing you the ultimate dining experience right to your doorstep. From our signature juicy burgers and artisanal sandwiches to our authentic pizzas and fresh, crisp salads, every dish is prepared with the finest locally sourced ingredients and a touch of culinary love. Taste the difference today!
            </p>
          </div>
        </section>

        <section className="py-24 bg-surface-container-low">
          <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-square rounded-[3rem] overflow-hidden">
                <img className="w-full h-full object-cover" alt="Interior of modern premium restaurant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCn8I3BNulaT1M1HrTlARKl1sP-w-E0sV2UZLYELibUM61YV6vQlKVRS0xdIBlSAdaSNcNfLahyTKIGGRirvK56ekJ0oP8RFLjaF_AqcPv0iUWFbMulQ89ccbd2g0Y0z_jKhyeIjmXKF73v8O0U0yqu8E_C0yGbZwMbEARzNGKFTuKtUEdlHrZkXQ0N0OXlQ7SLljtpovaQhR1PExDDWYG8DNnj8UuHrxecyhSVFBUbIKXKlLHzzdHA8DNLkg-gURYD044kZbjurq_M" />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-surface-container-highest rounded-full glass-effect p-8 flex flex-col items-center justify-center shadow-2xl">
                <Phone className="text-primary w-10 h-10 mb-2" />
                <p className="text-sm text-center font-bold">Fast Delivery</p>
                <p className="text-lg font-black text-primary">03238887892</p>
              </div>
            </div>
            <div>
              <h2 className="text-5xl font-headline font-black mb-8">Visit Our <span className="text-primary">Kitchen</span></h2>
              <div className="space-y-10">
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center shrink-0">
                    <MapPin className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Location</h4>
                    <p className="text-on-surface-variant leading-relaxed">J.B Mega Mart, Fauji Foundation Road, Near Ishfaq Chowk Harbanspura, Lahore.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center shrink-0">
                    <Clock className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Kitchen Hours</h4>
                    <p className="text-on-surface-variant">Monday — Sunday: 10:00 AM - 12:00 AM</p>
                  </div>
                </div>
                <div className="pt-6">
                  <div className="w-full h-48 rounded-3xl overflow-hidden opacity-70 hover:opacity-100 transition-all duration-500 shadow-lg border border-white/5">
                    <iframe
                      title="JB Mega Mart Location Map"
                      src="https://maps.google.com/maps?q=J.B%20Mega%20Mart,%20Fauji%20Foundation%20Road,%20Near%20Ishfaq%20Chowk%20Harbanspura,%20Lahore&t=&z=15&ie=UTF8&iwloc=&output=embed"
                      className="w-full h-full border-0 rounded-3xl"
                      style={{ filter: 'invert(90%) hue-rotate(180deg) contrast(1.2)' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-[#1c1b1b] w-full py-16 px-10 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-5 mb-6">
              <img src="/JBMM.png" alt="JBMM Logo" className="h-20 w-auto" />
              <span className="font-headline text-primary font-black text-2xl block">JB Mega Mart Kitchen</span>
            </div>
            <p className="font-body text-sm leading-relaxed text-[#e5e2e1]/60 mb-6">
              Redefining the neighborhood kitchen experience with premium ingredients and masterful preparation. Shop Smart. Live Better.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface cursor-pointer hover:bg-primary hover:text-on-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface cursor-pointer hover:bg-primary hover:text-on-primary transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold mb-6 text-primary uppercase text-xs tracking-widest">Navigation</h4>
              <ul className="space-y-4 font-body text-sm">
                <li><Link to="/#menu" className="text-[#e5e2e1]/60 hover:text-primary transition-colors">Menu</Link></li>
                <li><Link to="/#specials" className="text-[#e5e2e1]/60 hover:text-primary transition-colors">Specials</Link></li>
                <li><Link to="/#about" className="text-[#e5e2e1]/60 hover:text-primary transition-colors">About</Link></li>
                {activeOrder && (
                  <li><Link to={`/track-order/${activeOrder.id}`} className="text-[#e5e2e1]/60 hover:text-primary transition-colors">Track Order</Link></li>
                )}
                <li><Link to="/checkout" className="text-primary underline underline-offset-4">Order</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-primary uppercase text-xs tracking-widest">Legal</h4>
              <ul className="space-y-4 font-body text-sm text-[#e5e2e1]/60">
                <li><button onClick={() => setActiveLegalModal('Privacy')} className="hover:text-primary transition-colors">Privacy</button></li>
                <li><button onClick={() => setActiveLegalModal('Terms')} className="hover:text-primary transition-colors">Terms</button></li>
                <li><button onClick={() => setActiveLegalModal('Safety')} className="hover:text-primary transition-colors">Safety</button></li>
              </ul>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-primary uppercase text-xs tracking-widest">Newsletter</h4>
            <p className="text-sm text-[#e5e2e1]/60 mb-6">Get exclusive offers and secret recipes delivered to your inbox.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input 
                className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary w-full" 
                placeholder="Email address" 
                type="email" 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
              />
              <button type="submit" className="bg-primary text-on-primary p-3 rounded-xl hover:scale-105 transition-transform">
                <Send className="w-5 h-5" />
              </button>
            </form>
            {newsletterStatus.message && (
              <p className={`text-xs mt-2 font-bold ${newsletterStatus.type === 'success' ? 'text-green-500' : 'text-primary'}`}>
                {newsletterStatus.message}
              </p>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-body text-[#e5e2e1]/40">
          <p>© 2026 JB Mega Mart Kitchen. J.B Mega Mart, Fauji Foundation Road, Lahore. Tel: 03238887892</p>
          <div className="flex gap-8">
            <span>Designed for Excellence</span>
            <span>Crafted by TNT Innovations</span>
          </div>
        </div>
      </footer>
      {cartItemCount > 0 && (
        <div className="fixed bottom-8 left-0 right-0 z-[100] flex justify-center pointer-events-none px-6">
          <Link 
            to="/checkout" 
            onClick={(e) => {
              if (window.innerWidth >= 768) {
                e.preventDefault();
                setIsCartOpen(true);
              }
            }}
            className="pointer-events-auto"
          >
            <div className="bg-primary text-on-primary px-6 md:px-8 py-4 rounded-full shadow-[0_20px_40px_rgba(185,29,29,0.4)] flex items-center gap-4 md:gap-6 hover:scale-105 active:scale-95 transition-all cursor-pointer">
              <div className="flex items-center gap-2 font-bold bg-white/20 px-3 py-1 rounded-full text-sm">
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                <span>{cartItemCount}</span>
              </div>
              <span className="font-headline font-bold md:text-lg">Proceed to Checkout</span>
              <span className="font-bold border-l border-white/20 pl-4 md:pl-6">Rs. {cartTotal}</span>
            </div>
          </Link>
        </div>
      )}
      {activeOrder && (
        <div className="fixed bottom-8 right-8 z-[110] max-w-[280px] md:max-w-xs w-full">
          <Link to={`/track-order/${activeOrder.id}`}>
            <div className="glass-card bg-primary-container/90 backdrop-blur-2xl border border-primary/20 rounded-[2rem] p-5 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-pulse">
                  <div className="relative">
                    <Clock className="w-5 h-5" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-primary-container"></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">Live Status</h4>
                  <p className="font-headline font-black text-on-primary-container tracking-tight">
                    {activeOrder.status === 'Pending' && 'Order Received'}
                    {activeOrder.status === 'Preparing' && 'In the Kitchen'}
                    {activeOrder.status === 'Out for Delivery' && 'On its Way'}
                  </p>
                </div>
              </div>
              <div className="h-1.5 bg-on-primary-container/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ 
                    width: activeOrder.status === 'Pending' ? '25%' : 
                           activeOrder.status === 'Preparing' ? '60%' : 
                           activeOrder.status === 'Out for Delivery' ? '90%' : '0%' 
                  }}
                ></div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold opacity-60">#{activeOrder.id}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                  View Track <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
