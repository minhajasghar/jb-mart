import React, { useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShoppingCart, User, LayoutDashboard, Utensils, Package, Settings, Wallet, TrendingUp, ClipboardList, Search, RotateCcw, Receipt, Edit, Trash2, Plus, X, Star, CheckCircle2, XCircle, Clock, Upload, UserPlus, LayoutPanelTop } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext, OrderStatus, Product, Category, Order, getProductImage } from '../context/AppContext';
import SubcategorySection from '../components/SubcategorySection';
import MenuEditor from '../components/MenuEditor';
import ImageCropper from '../components/ImageCropper';

type Tab = 'Dashboard' | 'Live Orders' | 'Inventory' | 'Menu Editor' | 'Settings';

export default function Admin() {
  const { orders, products, categories, updateOrderStatus, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory, resetApp, subcategories, addSubcategory, updateSubcategory, deleteSubcategory, getCategorySubcategories, getCategoryType } = useAppContext();
  
  // Prevent cooks from accessing admin panel
  const userRole = sessionStorage.getItem('user_role');
  if (userRole === 'cook') {
    return <Navigate to="/kitchen" />;
  }
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropImageData, setCropImageData] = useState<{src: string; resolve: (base64: string) => void} | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const croppedBase64 = await new Promise<string>((resolve) => {
      setCropImageData({ src: base64, resolve });
    });

    if (!croppedBase64) throw new Error('Upload cancelled');

    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: croppedBase64 })
      });
      const data = await res.json();
      if (data.url) return data.url;
      throw new Error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCropConfirm = (croppedBase64: string) => {
    if (cropImageData) {
      cropImageData.resolve(croppedBase64);
      setCropImageData(null);
    }
  };

  const handleCropCancel = () => {
    if (cropImageData) {
      cropImageData.resolve('');
      setCropImageData(null);
    }
  };

  const handleCropSkip = () => {
    if (cropImageData) {
      cropImageData.resolve(cropImageData.src);
      setCropImageData(null);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const lastOrderIdRef = React.useRef<string | null>(null);
  
  // Auth State — use sessionStorage (set by /login page)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('admin_auth') === 'true' || sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(() => Number(localStorage.getItem('admin_attempts')) || 0);
  const [lockoutUntil, setLockoutUntil] = useState(() => Number(localStorage.getItem('admin_lockout')) || 0);
  const [loginError, setLoginError] = useState('');

  // Lockout Timer Logic
  const [currentTime, setCurrentTime] = useState(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isLockedOut = lockoutUntil > currentTime;
  const remainingLockoutTime = Math.ceil((lockoutUntil - currentTime) / 1000);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('admin_attempts', newAttempts.toString());
        if (newAttempts >= 3) {
          const lockoutTime = Date.now() + 3600000;
          setLockoutUntil(lockoutTime);
          localStorage.setItem('admin_lockout', lockoutTime.toString());
          setLoginError('Too many failed attempts. System locked for 1 hour.');
        } else {
          setLoginError(`Incorrect password. ${3 - newAttempts} attempts remaining.`);
        }
        return;
      }
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('user_role', data.user.role);
      sessionStorage.setItem('user_id', String(data.user.id));
      sessionStorage.setItem('user_name', data.user.name);
      setAttempts(0);
      localStorage.setItem('admin_attempts', '0');
      setLoginError('');
    } catch {
      setLoginError('Cannot reach server');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('user_name');
  };

  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [newOrderAlert, setNewOrderAlert] = useState<{id: string, name: string} | null>(null);

  // Settings State
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('jb_store_settings');
    return saved ? JSON.parse(saved) : {
      name: 'JB Mega Mart Kitchen',
      address: 'J.B Mega Mart, Fauji Foundation Road, Near Ishfaq Chowk Harbanspura, Lahore.',
      phone: '03238887892',
      deliveryRadius: 10,
      deliveryFee: 150,
      cashTax: 16,
      cardTax: 5,
      isKitchenOpen: true
    };
  });

  const handleSaveSettings = async () => {
    localStorage.setItem('jb_store_settings', JSON.stringify(storeSettings));
    try {
      await fetch('/api/settings-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: storeSettings.name,
          store_address: storeSettings.address,
          store_phone: storeSettings.phone,
          delivery_radius: String(storeSettings.deliveryRadius),
          delivery_fee: String(storeSettings.deliveryFee),
          cash_tax: String(storeSettings.cashTax),
          card_tax: String(storeSettings.cardTax),
          is_kitchen_open: storeSettings.isKitchenOpen ? 'true' : 'false'
        })
      });
    } catch (_) {}
    alert('Settings saved successfully!');
  };

  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState('');

  // User Management State
  const [users, setUsers] = useState<{id: number; name: string; role: string; createdAt?: string}[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<{id?: number; name: string; role: string; password: string} | null>(null);
  const [userError, setUserError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) { setUserError('Failed to load users'); return; }
      const data = await res.json();
      setUsers(data);
      setUserError('');
    } catch { setUserError('Cannot connect to server'); }
  };

  React.useEffect(() => { fetchUsers(); }, []);

  // Sound effect helper (Web Audio API - Bell Ring)
  const playNotificationSound = () => {
    try {
      const context = new AudioContext();
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

  // Monitor for new orders
  React.useEffect(() => {
    if (orders.length > 0) {
      const latestId = orders[0].id;
      
      // Initialize ref on first load so we don't alert old orders
      if (lastOrderIdRef.current === null) {
        lastOrderIdRef.current = latestId;
        return;
      }

      // If a new order ID appears that we haven't seen
      if (latestId !== lastOrderIdRef.current) {
        lastOrderIdRef.current = latestId;
        setNewOrderAlert({ id: latestId, name: orders[0].customerName });
        playNotificationSound();
        
        // Auto-dismiss after 8 seconds
        setTimeout(() => setNewOrderAlert(null), 8000);
      }
    }
  }, [orders]);
  
  // Inventory Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    costPrice: 0,
    image: '',
    variant: '',
    categoryId: '',
    isOutOfStock: false,
    subcategoryIds: []
  });

  // Category Edit State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({ name: '', image: '' });
  const [tempCategoryId, setTempCategoryId] = useState('');

  // Bulk Add State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkItemsText, setBulkItemsText] = useState('');
  const [bulkDefaultPrice, setBulkDefaultPrice] = useState(0);
  const [bulkDefaultCostPrice, setBulkDefaultCostPrice] = useState(0);
  const [bulkDefaultVariant, setBulkDefaultVariant] = useState('');
  const [bulkStatus, setBulkStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [bulkSubcategoryId, setBulkSubcategoryId] = useState('');

  // Subcategory Edit State
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryPrice, setNewSubcategoryPrice] = useState(0);
  const [tempHasSubcategories, setTempHasSubcategories] = useState(false);


  // Basic stats compilation from active orders
  const latestOrders = Array.isArray(orders) ? [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(order => {
      const idMatch = order.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const nameMatch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      return idMatch || nameMatch;
    }) : [];
  
  const todayOrders = Array.isArray(orders) ? orders.filter(o => o && o.createdAt && new Date(o.createdAt).toDateString() === new Date().toDateString()) : [];
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const todayCost = todayOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const todayProfit = todayOrders.reduce((sum, o) => sum + (o.profit || 0), 0);
  const activeOrdersCount = Array.isArray(orders) ? orders.filter(o => o && o.status !== 'Completed').length : 0;
  const pendingOrdersCount = Array.isArray(orders) ? orders.filter(o => o && o.status === 'Pending').length : 0;

  const mostOrderedItemToday = (() => {
    const counts: Record<string, number> = {};
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.quantity;
      });
    });
    const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return items.length > 0 ? items[0][0] : 'None';
  })();

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const openModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: 0, costPrice: 0, image: '', variant: '', categoryId: categories.length > 0 ? categories[0].id : '', isOutOfStock: false, subcategoryIds: [] });
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      ...formData,
      subcategoryId: formData.subcategoryIds?.length === 1 ? formData.subcategoryIds[0] : undefined,
    };
    if (editingProduct) {
      updateProduct({ ...editingProduct, ...productData } as Product);
    } else {
      const newId = formData.name?.toLowerCase().replace(/\s+/g, '-') || `prod-${Date.now()}`;
      addProduct({ ...productData, id: newId } as Product);
    }
    setIsModalOpen(false);
  };

  const toggleStockStatus = (product: Product) => {
    updateProduct({ ...product, isOutOfStock: !product.isOutOfStock });
  };

  const exportToCSV = () => {
    if (orders.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = ["Order ID", "Date", "Customer Name", "Phone", "Address", "Items Summary", "Total Cost (Rs)", "Revenue (Rs)", "Profit (Rs)", "Status"];
    const rows = orders.map(order => {
      const orderDate = new Date(order.createdAt).toLocaleString();
      const itemsSummary = order.items.map(i => `${i.quantity}x ${i.name}${i.instructions ? ` (Note: ${i.instructions})` : ''}`).join(' | ');
      const escapeCSV = (str: string | number | undefined) => `"${String(str || '').replace(/"/g, '""')}"`;
      return [
        escapeCSV(order.id),
        escapeCSV(orderDate),
        escapeCSV(order.customerName),
        escapeCSV(order.customerPhone),
        escapeCSV(order.address),
        escapeCSV(itemsSummary),
        Math.round(order.totalCost || 0),
        Math.round(order.total),
        Math.round(order.profit || 0),
        escapeCSV(order.status)
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `JB_Kitchen_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sideNavClass = (tab: Tab) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === tab ? 'bg-[#353534] text-primary font-bold active:scale-98' : 'text-[#e5e2e1]/70 hover:text-primary hover:bg-[#353534] active:scale-98'}`;
  const topNavClass = (tab: Tab) => `font-medium cursor-pointer transition-all duration-300 ${activeTab === tab ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-[#e5e2e1] hover:text-primary'}`;

  const renderOrdersTable = () => {
    const groupedOrders = latestOrders.reduce((groups, order) => {
      const date = new Date(order.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
      return groups;
    }, {} as Record<string, Order[]>);

    return (
      <section className="bg-surface-container-low rounded-[2rem] p-8 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Order History</h2>
          <div className="flex gap-4">
            <div className="relative">
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface-container-highest border-none rounded-full px-6 py-2 text-sm focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/50 w-64" 
                placeholder="Search orders..." 
                type="text" 
              />
              <Search className="absolute right-4 top-2 text-on-surface-variant/50 w-5 h-5 pointer-events-none" />
            </div>
          </div>
        </div>
        
        {Object.keys(groupedOrders).length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant font-medium bg-surface-container-highest rounded-2xl">
            No orders found.
          </div>
        ) : (
          <div className="space-y-12">
            {(Object.entries(groupedOrders) as [string, Order[]][]).map(([date, dateOrders]) => (
              <div key={date}>
                <h3 className="text-primary font-bold text-lg mb-4 border-b border-primary/20 pb-2">{date}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/10">
                        <th className="pb-6 pt-2 font-bold text-on-surface-variant uppercase tracking-widest">Order ID</th>
                        <th className="pb-6 pt-2 font-bold text-on-surface-variant uppercase tracking-widest">Time</th>
                        <th className="pb-6 pt-2 font-bold text-on-surface-variant uppercase tracking-widest">Customer</th>
                        <th className="pb-6 pt-2 font-bold text-on-surface-variant uppercase tracking-widest">Items</th>
                        <th className="pb-6 pt-2 font-bold text-on-surface-variant uppercase tracking-widest">Amount</th>
                        <th className="pb-6 pt-2 font-bold text-on-surface-variant uppercase tracking-widest text-green-500">Profit</th>
                        <th className="pb-6 pt-2 font-bold text-on-surface-variant uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {(dateOrders as Order[]).map(order => {
                        const initials = (order.customerName || 'Guest').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'GU';
                        const orderDate = new Date(order.createdAt);
                        const formattedTime = orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        const statusColors: any = {
                          'Pending': 'bg-primary/10 text-primary border-primary/20',
                          'Preparing': 'bg-tertiary/10 text-tertiary border-tertiary/20',
                          'Out for Delivery': 'bg-on-primary-container/10 text-on-primary-container border-on-primary-container/20',
                          'Completed': 'bg-green-500/10 text-green-400 border-green-500/20'
                        };
                        const statusColor = statusColors[order.status] || statusColors['Pending'];
                        return (
                          <tr key={order.id} className="group hover:bg-surface-container-highest transition-colors">
                            <td className="py-6 font-mono text-primary font-bold">{order.id}</td>
                            <td className="py-6 text-on-surface-variant">{formattedTime}</td>
                            <td className="py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-xs shrink-0">{initials}</div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-on-surface">{order.customerName}</span>
                                  <span className="text-[11px] text-[#e5e2e1]/60 font-medium">{order.customerPhone}</span>
                                  <span className="text-[11px] text-[#e5e2e1]/40 max-w-[180px] break-words whitespace-normal leading-tight" title={order.address}>{order.address}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-6 text-on-surface-variant">
                              {order.items.map((i, idx) => (
                                <div key={idx} className="mb-1">
                                  {i.quantity}x {i.name}
                                  {i.instructions && (
                                    <span className="block text-[10px] text-primary italic font-medium">Note: {i.instructions}</span>
                                  )}
                                </div>
                              ))}
                            </td>
                            <td className="py-6 font-bold">Rs. {order.total.toLocaleString()}</td>
                            <td className="py-6 font-bold text-green-500">Rs. {Math.round(order.profit || 0).toLocaleString()}</td>
                            <td className="py-6 text-right">
                              <select 
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                className={`px-4 py-1 rounded-full text-[10px] font-bold border appearance-none text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${statusColor}`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Preparing">Preparing</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderInventoryTab = () => (
    <section className="bg-surface-container-low rounded-[2rem] p-8 overflow-hidden border border-white/5 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter mb-2">Food Products Inventory</h2>
          <p className="text-on-surface-variant">Update prices, cost, and stock availability for your menu items.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" /> Add New Item
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/10">
              <th className="pb-6 pt-2 font-bold text-on-surface-variant text-xs uppercase tracking-[0.2em]">Item Details</th>
              <th className="pb-6 pt-2 font-bold text-on-surface-variant text-xs uppercase tracking-[0.2em]">Category/Variant</th>
              <th className="pb-6 pt-2 font-bold text-on-surface-variant text-xs uppercase tracking-[0.2em]">Cost Price</th>
              <th className="pb-6 pt-2 font-bold text-on-surface-variant text-xs uppercase tracking-[0.2em]">Sale Price</th>
              <th className="pb-6 pt-2 font-bold text-on-surface-variant text-xs uppercase tracking-[0.2em] text-primary">Profit</th>
              <th className="pb-6 pt-2 font-bold text-on-surface-variant text-xs uppercase tracking-[0.2em] text-center">Stock Status</th>
              <th className="pb-6 pt-2 font-bold text-on-surface-variant text-xs uppercase tracking-[0.2em] text-center">Special</th>
              <th className="pb-6 pt-2 font-bold text-on-surface-variant text-xs uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {Array.isArray(products) && products.map(p => {
              const profit = (p.price || 0) - (p.costPrice || 0);
              const margin = p.price > 0 ? Math.round((profit / p.price) * 100) : 0;
              return (
                <tr key={p.id} className={`group hover:bg-surface-container-highest transition-colors ${p.isOutOfStock ? 'opacity-50' : ''}`}>
                  <td className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container-highest">
                        <img src={getProductImage(p, subcategories, categories)} className="w-full h-full object-cover" alt={p.name} />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{p.name}</div>
                        <div className="text-xs text-on-surface-variant/60 font-mono uppercase">{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6">
                    <div className="flex flex-col gap-1">
                      <span className="bg-surface-container-highest px-3 py-1 rounded-full text-xs font-bold text-on-surface-variant uppercase tracking-widest self-start">
                        {p.variant || 'Standard'}
                      </span>
                      {p.subcategoryIds && p.subcategoryIds.length > 0 && (() => {
                        const selected = subcategories.filter(s => p.subcategoryIds!.includes(s.id));
                        if (selected.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-1">
                            {selected.map(s => (
                              <span key={s.id} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="py-6 font-medium text-on-surface-variant">Rs. {p.costPrice?.toLocaleString()}</td>
                  <td className="py-6 font-bold">Rs. {p.price?.toLocaleString() ?? '—'}</td>
                  <td className="py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">Rs. {profit.toLocaleString()}</span>
                      <span className="text-[10px] font-black uppercase text-primary/50 tracking-widest">{margin}% Margin</span>
                    </div>
                  </td>
                  <td className="py-6 text-center">
                    <button 
                      onClick={() => toggleStockStatus(p)}
                      className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-xl font-bold text-xs transition-all ${p.isOutOfStock ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}
                    >
                      {p.isOutOfStock ? (
                        <>
                          <XCircle className="w-4 h-4" /> Out of Stock
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> In Stock
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-6 text-center">
                    <button 
                      onClick={() => updateProduct({...p, isSpecial: !p.isSpecial})}
                      className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-xl font-bold text-xs transition-all ${p.isSpecial ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-surface-container-highest text-on-surface-variant/50 border border-transparent'}`}
                    >
                      {p.isSpecial ? (
                        <>
                          <Star className="w-4 h-4 fill-current" /> Special
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" /> Normal
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(p)} className="p-2 rounded-lg bg-surface-container-highest text-on-surface hover:bg-primary hover:text-on-primary transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if(window.confirm(`Delete ${p.name}?`)) deleteProduct(p.id); }} className="p-2 rounded-lg bg-surface-container-highest text-on-surface hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Category Management */}
      <div className="mt-12 border-t border-outline-variant/10 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black tracking-tighter mb-1">Category Management</h3>
            <p className="text-on-surface-variant text-sm">Organize menu items into categories for better browsing.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setBulkCategoryId(categories.length > 0 ? categories[0].id : ''); setBulkItemsText(''); setBulkDefaultPrice(0); setBulkDefaultCostPrice(0); setBulkDefaultVariant(''); setBulkSubcategoryId(''); setBulkStatus(null); setIsBulkModalOpen(true); }}
              className="bg-surface-container-highest text-on-surface px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-primary hover:text-on-primary transition-all text-sm"
            >
              <Package className="w-4 h-4" /> Bulk Add
            </button>
            <button
                onClick={() => { setEditingCategory(null); setCategoryFormData({ name: '', image: '' }); setTempCategoryId('cat-temp-' + Date.now()); setTempHasSubcategories(false); setIsCategoryModalOpen(true); }}
              className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform text-sm"
            >
              <Plus className="w-4 h-4" /> New Category
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="bg-surface-container-highest px-5 py-3 rounded-2xl flex items-center gap-4 group hover:bg-surface-container-low transition-colors border border-outline-variant/5">
              {cat.image && <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />}
              <span className="font-bold text-sm">{cat.name}</span>
              <button
                onClick={() => { setEditingCategory(cat); setCategoryFormData({ name: cat.name, image: cat.image || '' }); setTempHasSubcategories(cat.hasSubcategories || false); setIsCategoryModalOpen(true); }}
                className="p-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all opacity-0 group-hover:opacity-100"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { if (window.confirm(`Delete category "${cat.name}"? Products in this category will become uncategorized.`)) deleteCategory(cat.id); }}
                className="p-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-on-surface-variant/50 text-sm italic">No categories yet. Create one to organize your menu.</p>
          )}
        </div>
      </div>
    </section>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2070')] bg-cover bg-center">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative glass-card w-full max-w-md rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden"
        >
          <div className="p-10 text-center">
            <div className="flex justify-center mb-8">
              <img src="/JBMM.png" alt="Logo" className="h-24 w-auto drop-shadow-2xl" />
            </div>
            <h2 className="font-headline text-3xl font-black text-on-surface mb-2 italic">Admin <span className="text-primary">Portal</span></h2>
            <p className="text-on-surface-variant text-sm uppercase tracking-[0.2em] font-bold mb-10">Restricted Access Control</p>

            {isLockedOut ? (
              <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8">
                <Clock className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-primary mb-2">Security Lockout</h3>
                <p className="text-sm text-on-surface-variant mb-4">Too many failed attempts. Access is suspended.</p>
                <div className="text-3xl font-mono font-black text-on-surface">{formatTime(remainingLockoutTime)}</div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary group-focus-within:scale-110 transition-transform">
                    <Settings className="w-5 h-5" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Admin Password"
                    className="w-full bg-surface-container-highest border-none rounded-2xl p-5 pl-12 text-on-surface focus:ring-2 focus:ring-primary transition-all text-center tracking-[0.3em] font-black"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {loginError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 py-3 rounded-xl"
                  >
                    {loginError}
                  </motion.p>
                )}

                <button 
                  type="submit"
                  className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
                >
                  Authorize Access
                </button>
              </form>
            )}
            
            <Link to="/" className="inline-block mt-10 text-xs font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors">
              ← Return to Main Site
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary selection:text-on-primary">
      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-surface-container-low w-full max-w-lg rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black tracking-tighter">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="bg-surface-container-highest p-2 rounded-full hover:bg-red-500 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Product Name</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Zinger Premium Burger"
                    />
                  </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Sale Price (Rs)</label>
                      <input 
                        required
                        type="number"
                        value={formData.price ?? ''}
                        onChange={(e) => setFormData({...formData, price: e.target.value ? Number(e.target.value) : null})}
                        className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Cost Price (Rs)</label>
                    <input 
                      required
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({...formData, costPrice: Number(e.target.value)})}
                      className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Category</label>
                    <select
                      value={formData.categoryId || ''}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value, subcategoryIds: []})}
                      className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                    >
                      <option value="">No Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Variant (Optional)</label>
                    <input 
                      value={formData.variant}
                      onChange={(e) => setFormData({...formData, variant: e.target.value})}
                      className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Large (14 inch)"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Product Image</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-surface-container-highest hover:bg-surface-container-highest/80 rounded-2xl overflow-hidden flex items-center gap-3 border-2 border-dashed border-outline-variant/30 transition-colors flex-1 relative h-20">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const preview = URL.createObjectURL(file);
                              setFormData(p => ({ ...p, image: preview }));
                              try {
                                const url = await uploadImage(file);
                                setFormData(p => ({ ...p, image: url }));
                              } catch (_) {
                                setFormData(p => ({ ...p, image: '' }));
                              }
                            }
                          }}
                          className="hidden"
                        />
                        {formData.image ? (
                          <img src={formData.image} alt="" className="w-full h-full object-cover absolute inset-0" />
                        ) : (
                          <div className="flex items-center gap-3 p-4">
                            <Upload className="w-5 h-5 text-on-surface-variant/50" />
                            <span className="text-sm text-on-surface-variant">Choose Image</span>
                          </div>
                        )}
                      </label>
                      {formData.image && (
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, image: '' }))}
                          className="p-3 rounded-2xl bg-surface-container-highest hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {formData.categoryId && (() => {
                    const catSubs = getCategorySubcategories(formData.categoryId!);
                    if (catSubs.length === 0) return null;
                    const selectedIds = formData.subcategoryIds || [];
                    return (
                      <div className="col-span-2 bg-surface-container-highest/40 rounded-2xl p-4 border border-white/5">
                        <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Subcategories (select which apply)</label>
                        <select
                          multiple
                          value={selectedIds}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const selected = Array.from(e.target.selectedOptions, (o: HTMLOptionElement) => o.value);
                            setFormData({ ...formData, subcategoryIds: selected });
                          }}
                          className="w-full bg-surface-container-low border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
                        >
                          {catSubs.map(sc => (
                            <option key={sc.id} value={sc.id}>
                              {sc.name}{sc.priceAdjustment !== 0 ? ` (${sc.priceAdjustment > 0 ? '+' : ''}Rs.${sc.priceAdjustment})` : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-on-surface-variant/50 mt-1 italic">Ctrl+click to select multiple</p>
                      </div>
                    );
                  })()}
                  {editingProduct && formData.categoryId && getCategorySubcategories(formData.categoryId).length > 0 && (
                    <div className="col-span-2 bg-surface-container-highest/40 rounded-2xl p-4 border border-white/5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Subcategories (selected above)</label>
                      <p className="text-[10px] text-on-surface-variant/50 italic">Manage subcategory options in the Category Management section.</p>
                    </div>
                  )}
                  <div className="col-span-2 flex items-center gap-3 bg-surface-container-highest p-4 rounded-2xl">
                    <input 
                      type="checkbox"
                      id="outOfStock"
                      checked={formData.isOutOfStock}
                      onChange={(e) => setFormData({...formData, isOutOfStock: e.target.checked})}
                      className="w-5 h-5 rounded border-none bg-background text-primary focus:ring-primary"
                    />
                    <label htmlFor="outOfStock" className="text-sm font-bold cursor-pointer">Mark as Out of Stock</label>
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" disabled={uploading} className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {editingProduct ? 'Update Product Details' : 'Add Item to Menu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-surface-container-low w-full max-w-lg rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black tracking-tighter">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                <button onClick={() => { setIsCategoryModalOpen(false); setTempCategoryId(''); }} className="bg-surface-container-highest p-2 rounded-full hover:bg-red-500 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Category Name</label>
                  <input
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Beverages"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Category Image (Optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-surface-container-highest hover:bg-surface-container-highest/80 rounded-2xl overflow-hidden flex items-center gap-3 border-2 border-dashed border-outline-variant/30 transition-colors flex-1 relative h-20">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const preview = URL.createObjectURL(file);
                            setCategoryFormData(p => ({ ...p, image: preview }));
                            try {
                              const url = await uploadImage(file);
                              setCategoryFormData(p => ({ ...p, image: url }));
                            } catch (_) {
                              setCategoryFormData(p => ({ ...p, image: '' }));
                            }
                          }
                        }}
                        className="hidden"
                      />
                      {categoryFormData.image ? (
                        <img src={categoryFormData.image} alt="" className="w-full h-full object-cover absolute inset-0" />
                      ) : (
                        <div className="flex items-center gap-3 p-4">
                          <Upload className="w-5 h-5 text-on-surface-variant/50" />
                          <span className="text-sm text-on-surface-variant">Choose Image</span>
                        </div>
                      )}
                    </label>
                    {categoryFormData.image && (
                      <>
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const preview = URL.createObjectURL(file);
                                setCategoryFormData(p => ({ ...p, image: preview }));
                                (async () => {
                                  try {
                                    const url = await uploadImage(file);
                                    setCategoryFormData(p => ({ ...p, image: url }));
                                  } catch (_) {
                                    setCategoryFormData(p => ({ ...p, image: '' }));
                                  }
                                })();
                              }
                            };
                            input.click();
                          }}
                          className="p-3 rounded-2xl bg-surface-container-highest hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50"
                        >
                          <Upload className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryFormData(p => ({ ...p, image: '' }))}
                          className="p-3 rounded-2xl bg-surface-container-highest hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-surface-container-highest/40 rounded-2xl p-4 border border-white/5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempHasSubcategories}
                      onChange={(e) => setTempHasSubcategories(e.target.checked)}
                      className="w-5 h-5 rounded border-none bg-background text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Enable Subcategories</span>
                  </label>
                </div>

                {/* Subcategories */}
                <SubcategorySection
                  categoryId={editingCategory ? editingCategory.id : tempCategoryId}
                  newSubcategoryName={newSubcategoryName}
                  setNewSubcategoryName={setNewSubcategoryName}
                  newSubcategoryPrice={newSubcategoryPrice}
                  setNewSubcategoryPrice={setNewSubcategoryPrice}
                  addSubcategory={addSubcategory}
                  updateSubcategory={updateSubcategory}
                  deleteSubcategory={deleteSubcategory}
                  getCategorySubcategories={getCategorySubcategories}
                  uploadImage={uploadImage}
                  uploading={uploading}
                  onAddItem={(subcategoryId, subcategoryName) => {
                    setIsCategoryModalOpen(false);
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      price: 0,
                      costPrice: 0,
                      image: '',
                      variant: '',
                      categoryId: editingCategory ? editingCategory.id : tempCategoryId,
                      isOutOfStock: false,
                      subcategoryIds: [subcategoryId],
                    });
                    setIsModalOpen(true);
                  }}
                />

                <button type="button" disabled={uploading || saving} onClick={async () => {
                  if (!categoryFormData.name?.trim()) return;
                  setSaving(true);
                  try {
                    const image = categoryFormData.image?.trim() || '';
                    if (editingCategory) {
                      await updateCategory({ ...editingCategory, name: categoryFormData.name.trim(), image, hasSubcategories: tempHasSubcategories });
                    } else {
                      await addCategory({ id: tempCategoryId, name: categoryFormData.name.trim(), displayOrder: categories.length + 1, image, hasSubcategories: tempHasSubcategories });
                    }
                    setIsCategoryModalOpen(false);
                    setTempCategoryId('');
                  } catch (e) {
                    console.error('Failed to save category', e);
                  } finally {
                    setSaving(false);
                  }
                }} className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-surface-container-low w-full max-w-lg rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black tracking-tighter">Bulk Add Items</h2>
                <button onClick={() => setIsBulkModalOpen(false)} className="bg-surface-container-highest p-2 rounded-full hover:bg-red-500 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!bulkCategoryId || !bulkItemsText.trim()) return;
                const lines = bulkItemsText.trim().split('\n').map(l => l.trim()).filter(Boolean);
                let created = 0;
                lines.forEach(name => {
                  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
                  addProduct({
                    id,
                    name,
                    price: bulkDefaultPrice || 0,
                    costPrice: bulkDefaultCostPrice || 0,
                    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
                    variant: bulkDefaultVariant || undefined,
                    categoryId: bulkCategoryId,
                    subcategoryId: bulkSubcategoryId || undefined,
                    subcategoryIds: bulkSubcategoryId ? [bulkSubcategoryId] : undefined,
                    isOutOfStock: false,
                  });
                  created++;
                });
                setBulkStatus({ type: 'success', message: `Successfully added ${created} items!` });
                setBulkItemsText('');
                setTimeout(() => { if (!isBulkModalOpen) return; setIsBulkModalOpen(false); }, 1500);
              }} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Category</label>
                  <select
                    required
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Default Sale Price (Rs)</label>
                    <input 
                      type="number"
                      value={bulkDefaultPrice}
                      onChange={(e) => setBulkDefaultPrice(Number(e.target.value))}
                      className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Default Cost Price (Rs)</label>
                    <input 
                      type="number"
                      value={bulkDefaultCostPrice}
                      onChange={(e) => setBulkDefaultCostPrice(Number(e.target.value))}
                      className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Default Variant (Optional)</label>
                  <input 
                    value={bulkDefaultVariant}
                    onChange={(e) => setBulkDefaultVariant(e.target.value)}
                    className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Large (14 inch)"
                  />
                </div>

                {bulkCategoryId && getCategorySubcategories(bulkCategoryId).length > 0 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Subcategory</label>
                    <select
                      value={bulkSubcategoryId}
                      onChange={(e) => setBulkSubcategoryId(e.target.value)}
                      className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                    >
                      <option value="">None</option>
                      {getCategorySubcategories(bulkCategoryId).map(sc => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Item Names <span className="text-on-surface-variant/50 font-normal normal-case">(one per line)</span>
                  </label>
                  <textarea
                    required
                    value={bulkItemsText}
                    onChange={(e) => setBulkItemsText(e.target.value)}
                    className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary font-mono text-sm"
                    placeholder={`Zinger Burger\nGrilled Chicken Sandwich\nClub Sandwich\nChicken Wrap`}
                    rows={6}
                  />
                </div>

                {bulkItemsText.trim() && (
                  <div className="bg-surface-container-highest/40 rounded-2xl p-4 border border-white/5">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Preview ({bulkItemsText.trim().split('\n').map(l => l.trim()).filter(Boolean).length} items)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {bulkItemsText.trim().split('\n').map((l, i) => {
                        const name = l.trim();
                        return name ? (
                          <span key={i} className="bg-surface-container-highest px-2.5 py-1 rounded-lg text-xs font-medium">
                            {name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {bulkStatus && (
                  <div className={`${bulkStatus.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} rounded-2xl p-4 text-center text-sm font-bold border`}>
                    {bulkStatus.message}
                  </div>
                )}

                <button type="submit" className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all">
                  Add All Items
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#131313]/70 backdrop-blur-[32px] flex justify-between items-center px-10 h-24 shadow-[0_40px_60px_rgba(229,226,225,0.05)]">
        <div className="flex items-center gap-5">
          <img src="/JBMM.png" alt="Logo" className="h-16 w-auto" />
          <div className="text-2xl font-black text-primary italic font-headline tracking-tight">Admin Hub</div>
          <button 
            onClick={playNotificationSound}
            className="text-xs bg-surface-container-highest text-on-surface-variant px-3 py-1.5 rounded-full hover:bg-primary hover:text-on-primary transition-colors ml-2"
          >
            🔊 Test Sound
          </button>
        </div>
        <div className="hidden md:flex gap-8 items-center font-headline tracking-tight">
          <a onClick={() => setActiveTab('Dashboard')} className={topNavClass('Dashboard')}>Dashboard</a>
          <a onClick={() => setActiveTab('Live Orders')} className={topNavClass('Live Orders')}>Live Orders</a>
          <a onClick={() => setActiveTab('Inventory')} className={topNavClass('Inventory')}>Inventory</a>
          <a onClick={() => setActiveTab('Menu Editor')} className={topNavClass('Menu Editor')}>Menu Editor</a>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-surface-container-highest text-on-surface-variant px-4 py-2 rounded-full hover:bg-primary hover:text-on-primary transition-all text-xs font-bold uppercase tracking-widest"
          >
            <XCircle className="w-4 h-4" /> Logout
          </button>
          <a onClick={() => setActiveTab('Settings')} className={topNavClass('Settings')}>Settings</a>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-primary active:scale-95 transition-transform cursor-pointer">
            <ShoppingCart className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 w-64 rounded-r-3xl bg-[#1c1b1b] backdrop-blur-xl gap-6 p-6 h-screen border-r border-white/5 z-40 hidden md:flex flex-col pt-32 shadow-2xl shadow-black/50">
        <div className="mb-4">
          <div className="flex items-center gap-5 mb-4">
            <img src="/JBMM.png" alt="Logo" className="h-12 w-auto" />
            <h2 className="text-primary font-headline font-bold text-lg">Admin Portal</h2>
          </div>
          <p className="text-[#e5e2e1]/40 font-body text-[10px] uppercase tracking-widest font-bold">JB Kitchen Management</p>
        </div>
        <nav className="flex flex-col gap-2 font-body text-sm">
          <a onClick={() => setActiveTab('Dashboard')} className={sideNavClass('Dashboard')}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </a>
          <a onClick={() => setActiveTab('Live Orders')} className={sideNavClass('Live Orders')}>
            <Utensils className="w-5 h-5" />
            History
          </a>
          <a onClick={() => setActiveTab('Inventory')} className={sideNavClass('Inventory')}>
            <Package className="w-5 h-5" />
            Inventory
          </a>
          <a onClick={() => setActiveTab('Menu Editor')} className={sideNavClass('Menu Editor')}>
            <LayoutPanelTop className="w-5 h-5" />
            Menu Editor
          </a>
          <a onClick={() => setActiveTab('Settings')} className={sideNavClass('Settings')}>
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </nav>
      </aside>

      {/* Image Crop Modal */}
      {cropImageData && (
        <ImageCropper
          imageUrl={cropImageData.src}
          onCrop={handleCropConfirm}
          onCancel={handleCropCancel}
          onSkip={handleCropSkip}
        />
      )}

      {/* Main Content Canvas */}
      <main className="md:ml-64 pt-28 px-6 md:px-10 pb-12">
        {/* New Order Notification Banner */}
        {newOrderAlert && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6 pointer-events-none">
            <div className="bg-primary text-on-primary p-6 rounded-[2rem] shadow-[0_30px_60px_rgba(185,29,29,0.4)] border border-white/20 flex items-center justify-between pointer-events-auto animate-bounce-short">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Package className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-lg tracking-tight">New Order Received!</h4>
                  <p className="text-xs opacity-80 font-mono">Order #{newOrderAlert.id} • {newOrderAlert.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setNewOrderAlert(null)}
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-2">{activeTab}</h1>
            <p className="text-on-surface-variant max-w-xl">
              {activeTab === 'Dashboard' && "Real-time oversight of culinary operations, active orders, and kitchen performance analytics."}
              {activeTab === 'Live Orders' && "Comprehensive history of all kitchen orders, past and present."}
              {activeTab === 'Inventory' && "Manage stock levels, prices, and food items on your public menu."}
              {activeTab === 'Menu Editor' && "Visually reorder categories, subcategories, and menu items as they appear to customers."}
              {activeTab === 'Settings' && "Configure portal preferences and kitchen parameters."}
            </p>
          </div>
          <div className="bg-surface-container-low p-1 rounded-full flex gap-2">
            <button onClick={() => { if(window.confirm('Are you sure you want to completely wipe all current orders and cart data?')) resetApp(); }} className="bg-primary/10 text-primary px-6 py-2 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-primary/20 transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset Data
            </button>
            <button onClick={exportToCSV} className="text-on-surface px-6 py-2 rounded-full font-medium text-sm hover:bg-surface-container-highest transition-colors">Export CSV</button>
          </div>
        </div>

        {activeTab === 'Dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Total Orders Today */}
              <div className="glass-card p-6 rounded-[2rem] border border-outline-variant/10 group hover:bg-primary-container transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/30"></div>
                <div className="relative z-10">
                  <ClipboardList className="text-primary group-hover:text-on-primary mb-4 w-8 h-8 block" />
                  <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-on-primary/70">Orders Today</h3>
                  <p className="text-4xl font-black text-on-surface group-hover:text-on-primary tracking-tighter">{todayOrders.length}</p>
                </div>
              </div>

              {/* Total Revenue Today */}
              <div className="glass-card p-6 rounded-[2rem] border border-outline-variant/10 group hover:bg-primary-container transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/30"></div>
                <div className="relative z-10">
                  <Wallet className="text-primary group-hover:text-on-primary mb-4 w-8 h-8 block" />
                  <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-on-primary/70">Revenue Today</h3>
                  <p className="text-4xl font-black text-on-surface group-hover:text-on-primary tracking-tighter">Rs. {todayRevenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Total Cost Today */}
              <div className="glass-card p-6 rounded-[2rem] border border-outline-variant/10 group hover:bg-tertiary-container transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 rounded-full blur-3xl group-hover:bg-tertiary/30"></div>
                <div className="relative z-10">
                  <Receipt className="text-tertiary group-hover:text-on-tertiary-container mb-4 w-8 h-8 block" />
                  <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-on-tertiary-container/70">Total Cost Today</h3>
                  <p className="text-4xl font-black text-on-surface group-hover:text-on-tertiary-container tracking-tighter">Rs. {Math.round(todayCost).toLocaleString()}</p>
                </div>
              </div>

              {/* Total Profit Today */}
              <div className="glass-card p-6 rounded-[2rem] border border-outline-variant/10 group hover:bg-[#2ecc71] transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <TrendingUp className="text-primary group-hover:text-white mb-4 w-8 h-8 block" />
                  <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-white/70">Profit Today</h3>
                  <p className="text-4xl font-black text-on-surface group-hover:text-white tracking-tighter">Rs. {Math.round(todayProfit).toLocaleString()}</p>
                </div>
              </div>

              {/* Pending Orders */}
              <div className="glass-card p-6 rounded-[2rem] border border-outline-variant/10 group hover:bg-tertiary-container transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 rounded-full blur-3xl group-hover:bg-tertiary/30"></div>
                <div className="relative z-10">
                  <Clock className="text-tertiary group-hover:text-on-tertiary-container mb-4 w-8 h-8 block" />
                  <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-on-tertiary-container/70">Pending Orders</h3>
                  <p className="text-4xl font-black text-on-surface group-hover:text-on-tertiary-container tracking-tighter">{pendingOrdersCount}</p>
                </div>
              </div>
              
              {/* Most Ordered Item */}
              <div className="bg-primary-container p-6 rounded-[2rem] border border-primary/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50"></div>
                <div className="relative z-10">
                  <Star className="text-primary mb-4 w-8 h-8 block" />
                  <h3 className="text-on-primary-container text-xs font-bold uppercase tracking-widest mb-1">Top Item Today</h3>
                  <p className="text-2xl font-black text-on-primary tracking-tighter leading-tight">{mostOrderedItemToday}</p>
                </div>
              </div>
            </div>

            {renderOrdersTable()}
          </>
        )}

        {activeTab === 'Live Orders' && (
          <div>
            {renderOrdersTable()}
          </div>
        )}

        {activeTab === 'Inventory' && renderInventoryTab()}

        {activeTab === 'Menu Editor' && (
          <div>
            <MenuEditor />
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Profile Settings */}
              <div className="md:col-span-2 glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <User className="text-primary w-6 h-6" /> Store Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Store Name</label>
                    <input 
                      value={storeSettings.name}
                      onChange={(e) => setStoreSettings({...storeSettings, name: e.target.value})}
                      className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Contact Phone</label>
                    <input 
                      value={storeSettings.phone}
                      onChange={(e) => setStoreSettings({...storeSettings, phone: e.target.value})}
                      className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary" 
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Official Address</label>
                    <textarea 
                      value={storeSettings.address}
                      onChange={(e) => setStoreSettings({...storeSettings, address: e.target.value})}
                      className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary h-24 resize-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Operational Status */}
              <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                    <Clock className="text-primary w-6 h-6" /> Operations
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded-2xl">
                      <span className="font-bold">Kitchen Status</span>
                      <button 
                        onClick={() => setStoreSettings({...storeSettings, isKitchenOpen: !storeSettings.isKitchenOpen})}
                        className={`w-14 h-8 rounded-full relative transition-colors ${storeSettings.isKitchenOpen ? 'bg-green-500' : 'bg-red-500'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${storeSettings.isKitchenOpen ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest leading-relaxed">
                      Toggle this to instantly stop accepting new orders on the frontend.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleSaveSettings}
                  className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold mt-8 shadow-lg shadow-primary/20"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Business Rules */}
              <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <TrendingUp className="text-primary w-6 h-6" /> Business Rules
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Cash GST (%)</label>
                      <input 
                        type="number"
                        value={storeSettings.cashTax}
                        onChange={(e) => setStoreSettings({...storeSettings, cashTax: Number(e.target.value)})}
                        className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Card GST (%)</label>
                      <input 
                        type="number"
                        value={storeSettings.cardTax}
                        onChange={(e) => setStoreSettings({...storeSettings, cardTax: Number(e.target.value)})}
                        className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Delivery Radius (km)</label>
                    <input 
                      type="number"
                      value={storeSettings.deliveryRadius}
                      onChange={(e) => setStoreSettings({...storeSettings, deliveryRadius: Number(e.target.value)})}
                      className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Delivery Fee (Rs.)</label>
                    <input 
                      type="number"
                      value={storeSettings.deliveryFee || 150}
                      onChange={(e) => setStoreSettings({...storeSettings, deliveryFee: Number(e.target.value)})}
                      className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface" 
                    />
                  </div>
                  <button 
                    onClick={handleSaveSettings}
                    className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold mt-6 shadow-lg shadow-primary/20"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* User Management */}
              <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl md:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <UserPlus className="text-primary w-6 h-6" /> Users
                  </h3>
                  <button
                    onClick={() => { setEditingUser(null); setShowUserModal(true); setUserError(''); }}
                    className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add User
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-white/5">
                        <th className="text-left pb-3 font-bold">Name</th>
                        <th className="text-left pb-3 font-bold">Role</th>
                        <th className="text-right pb-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-on-surface-variant text-sm">No users found.</td></tr>
                      )}
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-white/5">
                          <td className="py-3 font-bold">{u.name}</td>
                          <td className="py-3">
                            <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${u.role === 'admin' ? 'bg-primary/10 text-primary' : u.role === 'cook' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setEditingUser({ id: u.id, name: u.name, role: u.role, password: '' });
                                setShowUserModal(true);
                                setUserError('');
                              }}
                              className="text-on-surface-variant hover:text-primary p-1"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Delete user "${u.name}"?`)) return;
                                try {
                                  const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
                                  if (!res.ok) { setUserError('Failed to delete user'); return; }
                                  fetchUsers();
                                } catch { setUserError('Cannot reach server'); }
                              }}
                              className="text-on-surface-variant hover:text-red-400 p-1 ml-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {userError && <p className="text-primary text-xs font-bold mt-4">{userError}</p>}
              </div>

              {/* Security Manager */}
              <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <Settings className="text-primary w-6 h-6" /> Admin Security
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Change Admin Password</label>
                    <input 
                      type="password"
                      placeholder="Enter New Password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface" 
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      if (newAdminPassword.length < 4) {
                        setPasswordChangeStatus('Password too short (min 4 chars)');
                        return;
                      }
                      try {
                        const userId = sessionStorage.getItem('user_id');
                        if (userId) {
                          const res = await fetch(`/api/users/${userId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password: newAdminPassword }),
                          });
                          if (!res.ok) { setPasswordChangeStatus('Failed to update'); return; }
                        } else {
                          const res = await fetch('/api/users');
                          const users = await res.json();
                          const admin = users.find((u: any) => u.role === 'admin');
                          if (!admin) { setPasswordChangeStatus('Admin user not found'); return; }
                          const r2 = await fetch(`/api/users/${admin.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password: newAdminPassword }),
                          });
                          if (!r2.ok) { setPasswordChangeStatus('Failed to update'); return; }
                        }
                        setPasswordChangeStatus('Success! Password updated.');
                        setNewAdminPassword('');
                      } catch { setPasswordChangeStatus('Cannot connect to server'); }
                    }}
                    className="w-full border border-primary/30 text-primary py-4 rounded-xl font-bold hover:bg-primary hover:text-on-primary transition-all"
                  >
                    Update Credential
                  </button>
                  {passwordChangeStatus && (
                    <p className="text-[10px] text-center font-bold text-primary uppercase tracking-widest">{passwordChangeStatus}</p>
                  )}
                </div>
              </div>
            </div>

            {/* User Modal */}
            {showUserModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-surface-container-low rounded-[2.5rem] p-10 w-full max-w-lg mx-4 border border-white/5 shadow-2xl">
                  <h3 className="text-2xl font-black tracking-tighter mb-6">
                    {editingUser ? 'Edit User' : 'Add User'}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Username</label>
                      <input
                        value={editingUser?.name || ''}
                        onChange={(e) => setEditingUser(p => p ? { ...p, name: e.target.value } : { id: undefined, name: e.target.value, role: 'user', password: '' })}
                        className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Password</label>
                      <input
                        type="password"
                        value={editingUser?.password || ''}
                        onChange={(e) => setEditingUser(p => p ? { ...p, password: e.target.value } : { id: undefined, name: '', role: 'user', password: e.target.value })}
                        className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                        placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Role</label>
                      <select
                        value={editingUser?.role || 'user'}
                        onChange={(e) => setEditingUser(p => p ? { ...p, role: e.target.value } : { id: undefined, name: '', role: e.target.value, password: '' })}
                        className="w-full bg-surface-container-highest border-none rounded-2xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                      >
                        <option value="cook">Cook</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => setShowUserModal(false)}
                        className="flex-1 border border-white/10 text-on-surface-variant py-4 rounded-2xl font-bold hover:bg-surface-container-highest transition-all"
                      >
                        Cancel
                      </button>
                      <button
                          onClick={async () => {
                            if (!editingUser) return;
                            if (!editingUser.name.trim()) { setUserError('Username is required'); return; }
                            if (!editingUser.id && !editingUser.password) { setUserError('Password is required for new users'); return; }
                            setUserError('');
                            try {
                              let res;
                              if (editingUser.id) {
                                const body: any = { name: editingUser.name.trim(), role: editingUser.role };
                                if (editingUser.password) body.password = editingUser.password;
                                res = await fetch(`/api/users/${editingUser.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(body),
                                });
                              } else {
                                res = await fetch('/api/users', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ name: editingUser.name.trim(), password: editingUser.password, role: editingUser.role }),
                                });
                              }
                              if (!res.ok) {
                                let errMsg = 'Request failed';
                                try { const d = await res.json(); errMsg = d.error || errMsg; } catch {}
                                setUserError(errMsg);
                                return;
                              }
                              setShowUserModal(false);
                              fetchUsers();
                            } catch { setUserError('Cannot reach server. Is it running?'); }
                          }}
                        className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-bold shadow-lg shadow-primary/20"
                      >
                        {editingUser?.id ? 'Save Changes' : 'Create User'}
                      </button>
                    </div>
                    {userError && <p className="text-primary text-xs font-bold text-center">{userError}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
