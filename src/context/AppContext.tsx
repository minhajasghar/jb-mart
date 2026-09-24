import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

export type Product = {
  id: string;
  name: string;
  price: number | null;
  costPrice?: number;
  image: string;
  variant?: string;
  categoryId?: string;
  subcategoryId?: string;
  isOutOfStock?: boolean;
  isSpecial?: boolean;
  subcategoryIds?: string[];
};

export type Category = {
  id: string;
  name: string;
  displayOrder?: number;
  image?: string;
  hasSubcategories?: boolean;

};

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  required: boolean;
  priceAdjustment: number;
  price?: number | null;
  displayOrder?: number;
  image?: string;
};

export type CartItem = Product & {
  quantity: number;
  instructions?: string;
};

export type OrderStatus = 'Pending' | 'Preparing' | 'Out for Delivery' | 'Completed';

export type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: CartItem[];
  total: number;
  totalCost: number;
  profit: number;
  status: OrderStatus;
  paymentMethod: 'COD' | 'Online';
  taxAmount: number;
  taxRate: number;
  createdAt: string;
};

export function getProductImage(product: Product, subcategories: Subcategory[], categories: Category[]): string {
  if (!product.image || product.image === '/drinks.png' || product.image === '') {
    if (product.subcategoryId) {
      const subcat = subcategories.find(s => s.id === product.subcategoryId);
      if (subcat && subcat.image && subcat.image !== '/drinks.png' && subcat.image !== '') {
        return subcat.image;
      }
    }
    if (product.subcategoryIds && product.subcategoryIds.length > 0) {
      for (const subcatId of product.subcategoryIds) {
        const subcat = subcategories.find(s => s.id === subcatId);
        if (subcat && subcat.image && subcat.image !== '/drinks.png' && subcat.image !== '') {
          return subcat.image;
        }
      }
    }
    if (product.categoryId) {
      const cat = categories.find(c => c.id === product.categoryId);
      if (cat && cat.image && cat.image !== '/drinks.png' && cat.image !== '') {
        return cat.image;
      }
    }
  }
  return product.image || '/drinks.png';
}

export type AppContextType = {
  cart: CartItem[];
  addToCart: (product: Product, selectedSubcategoryIds?: string[]) => void;
  updateQuantity: (id: string, delta: number) => void;
  updateInstructions: (id: string, instructions: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  orders: Order[];
  recentOrders: string[];
  products: Product[];
  categories: Category[];
  placeOrder: (orderData: { customerName: string; customerPhone: string; address: string; total: number; paymentMethod: 'COD' | 'Online'; taxAmount: number; taxRate: number }) => string;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  orderType: 'Delivery' | 'Pickup';
  setOrderType: (type: 'Delivery' | 'Pickup') => void;
  userLocation: string;
  setUserLocation: (loc: string) => void;
  isLocationVerified: boolean;
  setIsLocationVerified: (verified: boolean) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  subcategories: Subcategory[];
  addSubcategory: (subcategory: Subcategory) => void;
  updateSubcategory: (subcategory: Subcategory) => void;
  deleteSubcategory: (subcategoryId: string) => void;
  getCategorySubcategories: (categoryId: string) => Subcategory[];
  getCategoryType: (categoryId: string) => { hasSubcategories: boolean };
  resetApp: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'category-sandwiches', name: 'Sandwiches', displayOrder: 1, image: '/sandwich.jpeg' },
  { id: 'category-burgers', name: 'Burgers', displayOrder: 2, image: '/burgerr.jpeg' },
  { id: 'category-shawarma', name: 'Shawarma & Wraps', displayOrder: 3, image: '/shawarma.jpeg' },
  { id: 'category-pizza', name: 'Pizza', displayOrder: 4, image: '/Pizza.png', hasSubcategories: true },
  { id: 'category-salads', name: 'Salads', displayOrder: 5, image: '/salad.jpeg' },
  { id: 'category-fries', name: 'Fries', displayOrder: 6, image: '/Fries.png' },
  { id: 'category-nuggets', name: 'Nuggets', displayOrder: 7, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80' },
  { id: 'category-cakes', name: 'Cakes', displayOrder: 8, image: '/Cakes.png', hasSubcategories: true },
  { id: 'category-muffins', name: 'Cupcakes', displayOrder: 9, image: '/Muffins.jpeg' },
  { id: 'category-pastries', name: 'Pastries', displayOrder: 10, image: '/Pastries.jpeg' },
  { id: 'category-donuts-creamrolls', name: 'Donuts & Cream Rolls', displayOrder: 11, image: '/Donuts-Cream-rolls.png' },
  { id: 'category-bakarkhani', name: 'Bakarkhani', displayOrder: 12, image: '/Bakarkhani.jpeg' },
  { id: 'category-cookies-biscuits', name: 'Cookies & Biscuits', displayOrder: 13, image: '/Cookies-Buscuits.png' },
  { id: 'category-next-cola', name: 'Next Cola', displayOrder: 14, image: '/drinks.png', hasSubcategories: true },
  { id: 'category-pepsi', name: 'Pepsi', displayOrder: 15, image: '/drinks.png', hasSubcategories: true },
  { id: 'category-coke', name: 'Coke', displayOrder: 16, image: '/drinks.png', hasSubcategories: true }
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'zinger', name: 'Zinger Premium', price: 479.00, costPrice: 231.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC657iXrjbdM94s3wzIBMtYByorBfb0fjRntUKF72clKEzb9dWfRD2rea5iqzIj2__5IjBMPZhJe9U9y5zWbcaprFRK-czxmKQiSrawrk9j7zqZQj6sGL9Du7ZM1tyrNrz8ADNtLmr9zDNOlTUbSMwdy5-n7XZez_aP689Vbtr227fCa6iYfdctt7YgCEPtVGL1YJILUnE7x4I8AAYPktI59yfDnHU_zaAflLCg_ArbrKeRWe88CfJFJujbpovas5GxIddpUIEqrUMk', categoryId: 'category-burgers', isOutOfStock: false },
  { id: 'nuggets', name: 'Golden Nuggets', price: 399.00, costPrice: 166.00, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80', categoryId: 'category-nuggets', isOutOfStock: false },
  { id: 'cake-rusk', name: 'Cake Rusk', price: 1600.00, costPrice: 800.00, image: '/Cookies-Buscuits.png', categoryId: 'category-cookies-biscuits', isOutOfStock: false },
  { id: 'fries-std', name: 'Signature Fries - Std', price: 329.00, costPrice: 164.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCibaOg9i9ntRiYLvnipdTmMoFzX-gypwklzcXst9lXlvUaCt9UfJmU-_r4_hgLdB4k1uDKvOHdFAhPd58KR9r4Vw13_74FMw3I_dLtZZWMf0YJBDlnvl2g0gzywHmrHSyK6TjewSZaSg7TCbRtn5rv_ZWUWZ6lBerbsFaLfc88feUAjQke-fFPb4hmN7Zl_-hHe4tDp1_XKjPWlqBj_0rqP8fZiYU8R1AUgej0ZMEusP02RyXJr3dS4wcEBPL13ZhIBftKq8SAgQWU', categoryId: 'category-fries', isOutOfStock: false },
  { id: 'cream-roll', name: 'Cream Roll', price: 150.00, costPrice: 75.00, image: '/Donuts-Cream-rolls.png', categoryId: 'category-donuts-creamrolls', isOutOfStock: false },
  { id: 'salad-250g', name: 'Salad', price: 199.00, costPrice: 100.00, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', categoryId: 'category-salads', variant: '250g', isOutOfStock: false },
  { id: 'bakar-khani', name: 'Bakar Khani', price: 1600.00, costPrice: 800.00, image: '/Bakarkhani.jpeg', categoryId: 'category-bakarkhani', isOutOfStock: false },
  { id: 'pepsi-345ml', name: 'Pepsi 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-pepsi', isOutOfStock: false },
  { id: 'coke-can-250ml', name: 'Coke Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-coke', isOutOfStock: false },
  { id: 'chicken-sandwich', name: 'Chicken Sandwich', price: 549.00, costPrice: 227.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Ze5a2yfVx4mNRvn9l2t7W3hOifSMD53xCtabZfCfMLAOCeaW6BzlV8_s8sqc_MNVAqiCp7WtDGM_pEidtaycpmVeZbS54_t2FB55pUJw', categoryId: 'category-sandwiches', isOutOfStock: false },
  { id: 'chicken-shawarma', name: 'Chicken Shawarma', price: 399.00, costPrice: 242.00, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80', categoryId: 'category-shawarma', isOutOfStock: false },
  { id: 'muffin-chocolate', name: 'Cupcake Chocolate', price: 120.00, costPrice: 60.00, image: '/Muffins.jpeg', categoryId: 'category-muffins', isOutOfStock: false },
  { id: 'pineapple-pastry', name: 'Pineapple Pastry', price: 120.00, costPrice: 60.00, image: '/Pastries.jpeg', categoryId: 'category-pastries', isOutOfStock: false },
  { id: 'pineapple-cake-1lb', name: 'Pineapple Cake', price: 800.00, costPrice: 400.00, image: '/Cakes.png', categoryId: 'category-cakes', subcategoryId: 'subcat-cake-1lb', isOutOfStock: false },
  { id: 'pineapple-cake-2lb', name: 'Pineapple Cake', price: 1600.00, costPrice: 800.00, image: '/Cakes.png', categoryId: 'category-cakes', subcategoryId: 'subcat-cake-2lb', isOutOfStock: false },
  { id: 'pizza-lg-chicken-supreme', name: 'Chicken Supreme', price: 1799.00, costPrice: 823.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-large', isOutOfStock: false },
  { id: 'pizza-md-chicken-supreme', name: 'Chicken Supreme', price: 1149.00, costPrice: 478.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-medium', isOutOfStock: false },
  { id: 'pizza-sm-chicken-supreme', name: 'Chicken Supreme', price: 599.00, costPrice: 316.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-small', isOutOfStock: false },
  { id: 'donut', name: 'Donut', price: 150.00, costPrice: 75.00, image: '/Donuts-Cream-rolls.png', categoryId: 'category-donuts-creamrolls', isOutOfStock: false },
  { id: 'salad-500g', name: 'Salad', price: 349.00, costPrice: 175.00, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', categoryId: 'category-salads', variant: '500g', isOutOfStock: false },
  { id: 'almond-khatai', name: 'Almond Khatai', price: 1800.00, costPrice: 900.00, image: '/Cookies-Buscuits.png', categoryId: 'category-cookies-biscuits', isOutOfStock: false },
  { id: 'chicken-petti', name: 'Chicken Petti', price: 449.00, costPrice: 181.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC657iXrjbdM94s3wzIBMtYByorBfb0fjRntUKF72clKEzb9dWfRD2rea5iqzIj2__5IjBMPZhJe9U9y5zWbcaprFRK-czxmKQiSrawrk9j7zqZQj6sGL9Du7ZM1tyrNrz8ADNtLmr9zDNOlTUbSMwdy5-n7XZez_aP689Vbtr227fCa6iYfdctt7YgCEPtVGL1YJILUnE7x4I8AAYPktI59yfDnHU_zaAflLCg_ArbrKeRWe88CfJFJujbpovas5GxIddpUIEqrUMk', categoryId: 'category-burgers', isOutOfStock: false },
  { id: 'mirinda-345ml', name: 'Mirinda 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-mirinda', isOutOfStock: false },
  { id: 'tortilla-wrap', name: 'Tortilla Wrap', price: 449.00, costPrice: 317.00, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80', categoryId: 'category-shawarma', isOutOfStock: false },
  { id: 'tikka-sandwich', name: 'Tikka Sandwich', price: 549.00, costPrice: 227.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-sandwiches', isOutOfStock: false },
  { id: 'vanilla-muffin', name: 'Vanilla Cupcake', price: 120.00, costPrice: 60.00, image: '/Muffins.jpeg', categoryId: 'category-muffins', isOutOfStock: false },
  { id: 'fries-loaded-sm', name: 'Loaded Fries - Sm', price: 479.00, costPrice: 260.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCibaOg9i9ntRiYLvnipdTmMoFzX-gypwklzcXst9lXlvUaCt9UfJmU-_r4_hgLdB4k1uDKvOHdFAhPd58KR9r4Vw13_74FMw3I_dLtZZWMf0YJBDlnvl2g0gzywHmrHSyK6TjewSZaSg7TCbRtn5rv_ZWUWZ6lBerbsFaLfc88feUAjQke-fFPb4hmN7Zl_-hHe4tDp1_XKjPWlqBj_0rqP8fZiYU8R1AUgej0ZMEusP02RyXJr3dS4wcEBPL13ZhIBftKq8SAgQWU', categoryId: 'category-fries', isOutOfStock: false },
  { id: 'black-forest-pastry', name: 'Black Forest Pastry', price: 120.00, costPrice: 60.00, image: '/Pastries.jpeg', categoryId: 'category-pastries', isOutOfStock: false },
  { id: 'coke-zero-can-250ml', name: 'Coke Zero Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-coke', isOutOfStock: false },
  { id: 'black-forest-cake-1lb', name: 'Black Forest Cake', price: 800.00, costPrice: 400.00, image: '/Cakes.png', categoryId: 'category-cakes', subcategoryId: 'subcat-cake-1lb', isOutOfStock: false },
  { id: 'black-forest-cake-2lb', name: 'Black Forest Cake', price: 1600.00, costPrice: 800.00, image: '/Cakes.png', categoryId: 'category-cakes', subcategoryId: 'subcat-cake-2lb', isOutOfStock: false },
  { id: 'pizza-lg-chicken-tikka', name: 'Chicken Tikka', price: 1799.00, costPrice: 823.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-large', isOutOfStock: false },
  { id: 'pizza-md-chicken-tikka', name: 'Chicken Tikka', price: 1149.00, costPrice: 478.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-medium', isOutOfStock: false },
  { id: 'pizza-sm-chicken-tikka', name: 'Chicken Tikka', price: 599.00, costPrice: 316.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-small', isOutOfStock: false },
  { id: '7up-345ml', name: '7Up 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'salad-1kg', name: 'Salad', price: 649.00, costPrice: 325.00, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', categoryId: 'category-salads', variant: '1 KG', isOutOfStock: false },
  { id: 'plain-khatai', name: 'Plain Khatai', price: 1499.00, costPrice: 750.00, image: '/Cookies-Buscuits.png', categoryId: 'category-cookies-biscuits', isOutOfStock: false },
  { id: 'fajita-sandwich', name: 'Fajita Sandwich', price: 549.00, costPrice: 227.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Ze5a2yfVx4mNRvn9l2t7W3hOifSMD53xCtabZfCfMLAOCeaW6BzlV8_s8sqc_MNVAqiCp7WtDGM_pEidtaycpmVeZbS54_t2FB55pUJw', categoryId: 'category-sandwiches', isOutOfStock: false },
  { id: 'fries-loaded-lg', name: 'Loaded Fries - Lg', price: 549.00, costPrice: 377.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCibaOg9i9ntRiYLvnipdTmMoFzX-gypwklzcXst9lXlvUaCt9UfJmU-_r4_hgLdB4k1uDKvOHdFAhPd58KR9r4Vw13_74FMw3I_dLtZZWMf0YJBDlnvl2g0gzywHmrHSyK6TjewSZaSg7TCbRtn5rv_ZWUWZ6lBerbsFaLfc88feUAjQke-fFPb4hmN7Zl_-hHe4tDp1_XKjPWlqBj_0rqP8fZiYU8R1AUgej0ZMEusP02RyXJr3dS4wcEBPL13ZhIBftKq8SAgQWU', categoryId: 'category-fries', isOutOfStock: false },
  { id: 'sprite-can-250ml', name: 'Sprite Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: 'red-velvet-muffin', name: 'Red Velvet Cupcake', price: 120.00, costPrice: 60.00, image: '/Muffins.jpeg', categoryId: 'category-muffins', isOutOfStock: false },
  { id: 'red-velvet-pastry', name: 'Red Velvet Pastry', price: 120.00, costPrice: 60.00, image: '/Pastries.jpeg', categoryId: 'category-pastries', isOutOfStock: false },
  { id: 'red-velvet-cake-1lb', name: 'Red Velvet Cake', price: 800.00, costPrice: 400.00, image: '/Cakes.png', categoryId: 'category-cakes', subcategoryId: 'subcat-cake-1lb', isOutOfStock: false },
  { id: 'red-velvet-cake-2lb', name: 'Red Velvet Cake', price: 1600.00, costPrice: 800.00, image: '/Cakes.png', categoryId: 'category-cakes', subcategoryId: 'subcat-cake-2lb', isOutOfStock: false },
  { id: 'pizza-lg-chicken-fajita', name: 'Chicken Fajita', price: 1799.00, costPrice: 823.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-large', isOutOfStock: false },
  { id: 'pizza-md-chicken-fajita', name: 'Chicken Fajita', price: 1149.00, costPrice: 478.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-medium', isOutOfStock: false },
  { id: 'pizza-sm-chicken-fajita', name: 'Chicken Fajita', price: 599.00, costPrice: 316.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-small', isOutOfStock: false },
  { id: 'dew-345ml', name: 'Dew 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-dew', isOutOfStock: false },
  { id: 'bbq-sandwich', name: 'B.B.Q. Sandwich', price: 549.00, costPrice: 227.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Ze5a2yfVx4mNRvn9l2t7W3hOifSMD53xCtabZfCfMLAOCeaW6BzlV8_s8sqc_MNVAqiCp7WtDGM_pEidtaycpmVeZbS54_t2FB55pUJw', categoryId: 'category-sandwiches', isOutOfStock: false },
  { id: 'mix-fruit-pastry', name: 'Mix Fruit Pastry', price: 120.00, costPrice: 60.00, image: '/Pastries.jpeg', categoryId: 'category-pastries', isOutOfStock: false },
  { id: 'assorted-biscuits', name: 'Assorted Biscuits', price: 1499.00, costPrice: 750.00, image: '/Cookies-Buscuits.png', categoryId: 'category-cookies-biscuits', isOutOfStock: false },
  { id: 'mix-fruit-cake-1lb', name: 'Mix Fruit Cake', price: 800.00, costPrice: 400.00, image: '/Cakes.png', categoryId: 'category-cakes', subcategoryId: 'subcat-cake-1lb', isOutOfStock: false },
  { id: 'mix-fruit-cake-2lb', name: 'Mix Fruit Cake', price: 1600.00, costPrice: 800.00, image: '/Cakes.png', categoryId: 'category-cakes', subcategoryId: 'subcat-cake-2lb', isOutOfStock: false },
  { id: 'pizza-lg-peri-peri', name: 'Peri Peri Chicken', price: 1799.00, costPrice: 823.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-large', isOutOfStock: false },
  { id: 'pizza-md-peri-peri', name: 'Peri Peri Chicken', price: 1149.00, costPrice: 478.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-medium', isOutOfStock: false },
  { id: 'pizza-sm-peri-peri', name: 'Peri Peri Chicken', price: 599.00, costPrice: 316.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-small', isOutOfStock: false },
  { id: 'sprite-diet-can-250ml', name: 'Sprite Diet Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: 'fizzup-300ml', name: 'Fizzup 300ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-next-cola', subcategoryId: 'subcat-nextcola-fizzup', isOutOfStock: false },
  { id: '7up-zero-345ml', name: '7Up Zero 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'chocolate-pastry', name: 'Chocolate Pastry', price: 120.00, costPrice: 60.00, image: '/Pastries.jpeg', categoryId: 'category-pastries', isOutOfStock: false },
  { id: 'chocolate-cake-1lb', name: 'Chocolate Cake', price: 800.00, costPrice: 400.00, image: '/Cakes.png', categoryId: 'category-cakes', subcategoryId: 'subcat-cake-1lb', isOutOfStock: false },
  { id: 'chocolate-cake-2lb', name: 'Chocolate Cake', price: 1600.00, costPrice: 800.00, image: '/Cakes.png', categoryId: 'category-cakes', subcategoryId: 'subcat-cake-2lb', isOutOfStock: false },
  { id: 'peri-peri-sandwich', name: 'Peri Peri Sandwich', price: 549.00, costPrice: 227.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Ze5a2yfVx4mNRvn9l2t7W3hOifSMD53xCtabZfCfMLAOCeaW6BzlV8_s8sqc_MNVAqiCp7WtDGM_pEidtaycpmVeZbS54_t2FB55pUJw', categoryId: 'category-sandwiches', isOutOfStock: false },
  { id: 'sprite-mint-can-250ml', name: 'Sprite Mint Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: 'pizza-lg-smoked-chicken', name: 'Smoked Chicken', price: 1799.00, costPrice: 823.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-large', isOutOfStock: false },
  { id: 'pizza-md-smoked-chicken', name: 'Smoked Chicken', price: 1149.00, costPrice: 478.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-medium', isOutOfStock: false },
  { id: 'pizza-sm-smoked-chicken', name: 'Smoked Chicken', price: 599.00, costPrice: 316.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-small', isOutOfStock: false },
  { id: 'fizzup-500ml', name: 'Fizzup 500ml', price: 90.00, costPrice: 45.00, image: '/drinks.png', categoryId: 'category-next-cola', subcategoryId: 'subcat-nextcola-fizzup', isOutOfStock: false },
  { id: 'club-sandwich', name: 'Club Sandwich', price: 599.00, costPrice: 284.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Ze5a2yfVx4mNRvn9l2t7W3hOifSMD53xCtabZfCfMLAOCeaW6BzlV8_s8sqc_MNVAqiCp7WtDGM_pEidtaycpmVeZbS54_t2FB55pUJw', categoryId: 'category-sandwiches', isOutOfStock: false },
  { id: 'fanta-can-250ml', name: 'Fanta Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-fanta', isOutOfStock: false },
  { id: 'pepsi-zero-345ml', name: 'Pepsi Zero 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-pepsi', isOutOfStock: false },
  { id: 'pizza-lg-cheese-lover', name: 'Cheese Lover', price: 1799.00, costPrice: 823.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-large', isOutOfStock: false },
  { id: 'pizza-md-cheese-lover', name: 'Cheese Lover', price: 1149.00, costPrice: 478.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-medium', isOutOfStock: false },
  { id: 'pizza-sm-cheese-lover', name: 'Cheese Lover', price: 599.00, costPrice: 316.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', categoryId: 'category-pizza', subcategoryId: 'subcat-pizza-small', isOutOfStock: false },
  { id: 'coke-345ml', name: 'Coke 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-coke', isOutOfStock: false },
  { id: 'fizzup-1ltr', name: 'Fizzup 1ltr', price: 130.00, costPrice: 65.00, image: '/drinks.png', categoryId: 'category-next-cola', subcategoryId: 'subcat-nextcola-fizzup', isOutOfStock: false },
  { id: '7up-mint-345ml', name: '7Up Mint 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'pepsi-500ml', name: 'Pepsi 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-pepsi', isOutOfStock: false },
  { id: 'fizzup-1500ml', name: 'Fizzup 1500ml', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-next-cola', subcategoryId: 'subcat-nextcola-fizzup', isOutOfStock: false },
  { id: 'coke-zero-345ml', name: 'Coke Zero 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-coke', isOutOfStock: false },
  { id: 'sprite-345ml', name: 'Sprite 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: 'mirinda-500ml', name: 'Mirinda 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-mirinda', isOutOfStock: false },
  { id: 'next-water-500ml', name: 'Next Water 500ml', price: 50.00, costPrice: 25.00, image: '/drinks.png', categoryId: 'category-next-cola', subcategoryId: 'subcat-nextcola-water', isOutOfStock: false },
  { id: '7up-500ml', name: '7Up 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'cappy-palpi-300ml', name: 'Cappy Palpi 300ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-juices', isOutOfStock: false },
  { id: 'next-water-1500ml', name: 'Next Water 1500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-next-cola', subcategoryId: 'subcat-nextcola-water', isOutOfStock: false },
  { id: 'dew-500ml', name: 'Dew 500ml', price: 110.00, costPrice: 55.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-dew', isOutOfStock: false },
  { id: 'sprite-mint-345ml', name: 'Sprite Mint 345ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: 'coke-500ml', name: 'Coke 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-coke', isOutOfStock: false },
  { id: '7up-zero-500ml', name: '7Up Zero 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'coke-zero-500ml', name: 'Coke Zero 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-coke', isOutOfStock: false },
  { id: 'pepsi-zero-500ml', name: 'Pepsi Zero 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-pepsi', isOutOfStock: false },
  { id: 'sprite-500ml', name: 'Sprite 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: '7up-mint-500ml', name: '7Up Mint 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'pepsi-1ltr', name: 'Pepsi 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-pepsi', isOutOfStock: false },
  { id: 'sprite-zero-500ml', name: 'Sprite Zero 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: 'mirinda-1ltr', name: 'Mirinda 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-mirinda', isOutOfStock: false },
  { id: 'sprite-mint-500ml', name: 'Sprite Mint 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: '7up-1ltr', name: '7Up 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'fanta-500ml', name: 'Fanta 500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-fanta', isOutOfStock: false },
  { id: 'dew-1ltr', name: 'Dew 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-dew', isOutOfStock: false },
  { id: 'coke-1ltr', name: 'Coke 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-coke', isOutOfStock: false },
  { id: '7up-zero-1ltr', name: '7Up Zero 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'coke-zero-1ltr', name: 'Coke Zero 1ltr', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-coke', isOutOfStock: false },
  { id: 'sprite-1ltr', name: 'Sprite 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: 'pepsi-zero-1ltr', name: 'Pepsi Zero 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-pepsi', isOutOfStock: false },
  { id: '7up-mint-1ltr', name: '7Up Mint 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'sprite-zero-1ltr', name: 'Sprite Zero 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: 'pepsi-1500ml', name: 'Pepsi 1500ml', price: 200.00, costPrice: 100.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-pepsi', isOutOfStock: false },
  { id: 'sprite-mint-1ltr', name: 'Sprite Mint 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: 'fanta-1ltr', name: 'Fanta 1ltr', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-fanta', isOutOfStock: false },
  { id: 'mirinda-1500ml', name: 'Mirinda 1500ml', price: 200.00, costPrice: 100.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-mirinda', isOutOfStock: false },
  { id: '7up-1500ml', name: '7Up 1500ml', price: 200.00, costPrice: 100.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'coke-1500ml', name: 'Coke 1500ml', price: 180.00, costPrice: 90.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-coke', isOutOfStock: false },
  { id: 'dew-1500ml', name: 'Dew 1500ml', price: 200.00, costPrice: 100.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-dew', isOutOfStock: false },
  { id: 'coke-zero-1500ml', name: 'Coke Zero 1500ml', price: 180.00, costPrice: 90.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-coke', isOutOfStock: false },
  { id: 'sprite-1500ml', name: 'Sprite 1500ml', price: 180.00, costPrice: 90.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: '7up-zero-1500ml', name: '7Up Zero 1500ml', price: 200.00, costPrice: 100.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'pepsi-zero-1500ml', name: 'Pepsi Zero 1500ml', price: 200.00, costPrice: 100.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-pepsi', isOutOfStock: false },
  { id: 'sprite-zero-1500ml', name: 'Sprite Zero 1500ml', price: 180.00, costPrice: 90.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: '7up-mint-1500ml', name: '7Up Mint 1500ml', price: 200.00, costPrice: 100.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'sprite-mint-1500ml', name: 'Sprite Mint 1500ml', price: 180.00, costPrice: 90.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-sprite', isOutOfStock: false },
  { id: 'fanta-1500ml', name: 'Fanta 1500ml', price: 180.00, costPrice: 90.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-fanta', isOutOfStock: false },
  { id: 'pepsi-can-250ml', name: 'Pepsi Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-pepsi', isOutOfStock: false },
  { id: 'dasani-500ml', name: 'Dasani Water 500ml', price: 55.00, costPrice: 28.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-water', isOutOfStock: false },
  { id: '7up-can-250ml', name: '7Up Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'dasani-1500ml', name: 'Dasani Water 1500ml', price: 110.00, costPrice: 55.00, image: '/drinks.png', categoryId: 'category-coke', subcategoryId: 'subcat-coke-water', isOutOfStock: false },
  { id: 'pepsi-diet-can-250ml', name: 'Pepsi Diet Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-pepsi', isOutOfStock: false },
  { id: '7up-diet-can-250ml', name: '7Up Diet Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-7up', isOutOfStock: false },
  { id: 'mirinda-can-250ml', name: 'Mirinda Can 250ml', price: 120.00, costPrice: 60.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-mirinda', isOutOfStock: false },
  { id: 'aqyafina-500ml', name: 'Aqyafina Water 500ml', price: 50.00, costPrice: 25.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-water', isOutOfStock: false },
  { id: 'aqyafina-1500ml', name: 'Aqyafina Water 1500ml', price: 100.00, costPrice: 50.00, image: '/drinks.png', categoryId: 'category-pepsi', subcategoryId: 'subcat-pepsi-water', isOutOfStock: false },
  { id: 'next-cola-300ml', name: 'Next Cola 300ml', price: 70.00, costPrice: 35.00, image: '/drinks.png', categoryId: 'category-next-cola', subcategoryId: 'subcat-nextcola-nextcola', isOutOfStock: false },
  { id: 'next-cola-500ml', name: 'Next Cola 500ml', price: 90.00, costPrice: 45.00, image: '/drinks.png', categoryId: 'category-next-cola', subcategoryId: 'subcat-nextcola-nextcola', isOutOfStock: false },
  { id: 'next-cola-1ltr', name: 'Next Cola 1ltr', price: 130.00, costPrice: 65.00, image: '/drinks.png', categoryId: 'category-next-cola', subcategoryId: 'subcat-nextcola-nextcola', isOutOfStock: false },
  { id: 'next-cola-1500ml', name: 'Next Cola 1500ml', price: 160.00, costPrice: 80.00, image: '/drinks.png', categoryId: 'category-next-cola', subcategoryId: 'subcat-nextcola-nextcola', isOutOfStock: false }
];

const DEFAULT_SUBCATEGORIES: Subcategory[] = [
  { id: 'subcat-cake-1lb', categoryId: 'category-cakes', name: '1 LB', required: false, priceAdjustment: 0, displayOrder: 1 },
  { id: 'subcat-pizza-small', categoryId: 'category-pizza', name: 'Small (9")', required: false, priceAdjustment: 0, displayOrder: 1 },
  { id: 'subcat-cake-2lb', categoryId: 'category-cakes', name: '2 LB', required: false, priceAdjustment: 0, displayOrder: 2 },
  { id: 'subcat-pizza-medium', categoryId: 'category-pizza', name: 'Medium (12")', required: false, priceAdjustment: 0, displayOrder: 2 },
  { id: 'subcat-pizza-large', categoryId: 'category-pizza', name: 'Large (14")', required: false, priceAdjustment: 0, displayOrder: 3 },
  { id: 'subcat-nextcola-nextcola', categoryId: 'category-next-cola', name: 'Next Cola', required: false, priceAdjustment: 0, displayOrder: 1, image: '/drinks.png' },
  { id: 'subcat-nextcola-fizzup', categoryId: 'category-next-cola', name: 'Fizzup', required: false, priceAdjustment: 0, displayOrder: 2, image: '/fizzup.jpeg' },
  { id: 'subcat-nextcola-water', categoryId: 'category-next-cola', name: 'Next Water', required: false, priceAdjustment: 0, displayOrder: 3, image: '/Water.png' },
  { id: 'subcat-pepsi-pepsi', categoryId: 'category-pepsi', name: 'Pepsi', required: false, priceAdjustment: 0, displayOrder: 1, image: '/pepsi.png' },
  { id: 'subcat-pepsi-7up', categoryId: 'category-pepsi', name: '7Up', required: false, priceAdjustment: 0, displayOrder: 2, image: '/7up.png' },
  { id: 'subcat-pepsi-mirinda', categoryId: 'category-pepsi', name: 'Mirinda', required: false, priceAdjustment: 0, displayOrder: 3, image: '/mirinda.png' },
  { id: 'subcat-pepsi-dew', categoryId: 'category-pepsi', name: 'Mountain Dew', required: false, priceAdjustment: 0, displayOrder: 4, image: '/Mountain dew.png' },
  { id: 'subcat-pepsi-water', categoryId: 'category-pepsi', name: 'Water', required: false, priceAdjustment: 0, displayOrder: 5, image: '/Water.png' },
  { id: 'subcat-coke-coke', categoryId: 'category-coke', name: 'Coca-Cola', required: false, priceAdjustment: 0, displayOrder: 1, image: '/cocacola.png' },
  { id: 'subcat-coke-sprite', categoryId: 'category-coke', name: 'Sprite', required: false, priceAdjustment: 0, displayOrder: 2, image: '/Sprite.png' },
  { id: 'subcat-coke-fanta', categoryId: 'category-coke', name: 'Fanta', required: false, priceAdjustment: 0, displayOrder: 3, image: '/Fanta.png' },
  { id: 'subcat-coke-juices', categoryId: 'category-coke', name: 'Juices', required: false, priceAdjustment: 0, displayOrder: 4, image: '/Juice.jpeg' },
  { id: 'subcat-coke-water', categoryId: 'category-coke', name: 'Water', required: false, priceAdjustment: 0, displayOrder: 5, image: '/Water.png' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('jb_kitchen_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse orders from localStorage:', e);
      return [];
    }
  });

  const [recentOrders, setRecentOrders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jb_recent_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse recent orders from localStorage:', e);
      return [];
    }
  });

  const [orderType, setOrderType] = useState<'Delivery' | 'Pickup'>(() => {
    return (localStorage.getItem('jb_order_type') as 'Delivery' | 'Pickup') || 'Delivery';
  });
  const [userLocation, setUserLocation] = useState(() => {
    return localStorage.getItem('jb_user_location') || '';
  });
  const [isLocationVerified, setIsLocationVerified] = useState(() => {
    if (!localStorage.getItem('jb_user_location')) return false;
    return localStorage.getItem('jb_location_verified') === 'true';
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('jb_order_type', orderType);
    localStorage.setItem('jb_user_location', userLocation);
    localStorage.setItem('jb_location_verified', isLocationVerified ? 'true' : 'false');
  }, [orderType, userLocation, isLocationVerified]);

  useEffect(() => {
    const sessionActive = sessionStorage.getItem('jb_session_active');
    if (!sessionActive) {
      setIsLocationVerified(false);
      sessionStorage.setItem('jb_session_active', 'true');
    }
  }, []);

  // ─── Products & Categories State ───

  const APP_DATA_VERSION = '13';
  const REMOVED_DEFAULT_PRODUCT_IDS = new Set(['fresh-salad', 'pizza-sm', 'pizza-md', 'pizza-lg']);
  const REMOVED_DEFAULT_SUBCATEGORY_IDS = new Set(['subcat-drinks-nextcola', 'subcat-drinks-next', 'subcat-drinks-pepsi', 'subcat-drinks-coke', 'subcat-drinks-7up', 'subcat-drinks-mirinda', 'subcat-drinks-dew', 'subcat-drinks-sprite', 'subcat-drinks-fanta', 'subcat-drinks-fizzup', 'subcat-drinks-water', 'subcat-drinks-juices', 'subcat-drinks-pepsi-can', 'subcat-drinks-pepsi-345ml', 'subcat-drinks-pepsi-500ml', 'subcat-drinks-pepsi-1ltr', 'subcat-drinks-pepsi-1500ml', 'subcat-drinks-coke-can', 'subcat-drinks-coke-345ml', 'subcat-drinks-coke-500ml', 'subcat-drinks-coke-1ltr', 'subcat-drinks-coke-1500ml']);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('jb_kitchen_inventory');
      const ver = localStorage.getItem('jb_data_version');
      if (saved) {
        const parsed = JSON.parse(saved) as Product[];
        const cleaned = parsed.filter((p: Product) => !REMOVED_DEFAULT_PRODUCT_IDS.has(p.id));
        const aligned = cleaned.map(p => {
          const def = defaultProductMap.get(p.id);
          let mapped = { ...p };
          if (def?.subcategoryId && p.subcategoryId !== def.subcategoryId) {
            mapped.subcategoryId = def.subcategoryId;
          }
          if (!mapped.image && def?.image) {
            mapped.image = def.image;
          }
          return mapped;
        });
        if (ver !== APP_DATA_VERSION) {
          const defaultIds = new Set(DEFAULT_PRODUCTS.map(p => p.id));
          const userProducts = aligned.filter((p: Product) => !defaultIds.has(p.id));
          const merged = [...DEFAULT_PRODUCTS, ...userProducts];
          localStorage.setItem('jb_kitchen_inventory', JSON.stringify(merged));
          localStorage.setItem('jb_data_version', APP_DATA_VERSION);
          return merged;
        }
        localStorage.setItem('jb_kitchen_inventory', JSON.stringify(aligned));
        localStorage.setItem('jb_data_version', APP_DATA_VERSION);
        return aligned;
      }
    } catch (_) {}
    localStorage.setItem('jb_data_version', APP_DATA_VERSION);
    return DEFAULT_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('jb_kitchen_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedIds = new Set(parsed.map((c: any) => c.id));
        const missingDefaults = DEFAULT_CATEGORIES.filter(dc => !savedIds.has(dc.id));
        const merged = [...missingDefaults, ...parsed.map((cat: Category) => {
          const defaultCat = DEFAULT_CATEGORIES.find(dc => dc.id === cat.id);
          return {
            ...cat,
            image: cat.image || (defaultCat?.image || ''),
            hasSubcategories: cat.hasSubcategories !== undefined ? cat.hasSubcategories : (defaultCat?.hasSubcategories || false),
          };
        })].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        localStorage.setItem('jb_kitchen_categories', JSON.stringify(merged));
        return merged;
      }
    } catch (_) {}
    return DEFAULT_CATEGORIES;
  });

  const defaultSubcatMap = new Map(DEFAULT_SUBCATEGORIES.map(s => [s.id, s]));
  const defaultProductMap = new Map(DEFAULT_PRODUCTS.map(p => [p.id, p]));

  const [subcategories, setSubcategories] = useState<Subcategory[]>(() => {
    try {
      const saved = localStorage.getItem('jb_kitchen_subcategories');
      const ver = localStorage.getItem('jb_data_version');
      if (saved) {
        const parsed = JSON.parse(saved) as Subcategory[];
        const cleaned = parsed.filter((s: Subcategory) => !REMOVED_DEFAULT_SUBCATEGORY_IDS.has(s.id));
        const merged = cleaned.map(s => {
          const def = defaultSubcatMap.get(s.id);
          if (def && def.image && !s.image) {
            return { ...s, image: def.image };
          }
          return s;
        });
        if (ver !== APP_DATA_VERSION) {
          const defaultIds = new Set(DEFAULT_SUBCATEGORIES.map(s => s.id));
          const userSubcats = merged.filter((s: Subcategory) => !defaultIds.has(s.id));
          const final = [...DEFAULT_SUBCATEGORIES, ...userSubcats].map(s => {
            const def = defaultSubcatMap.get(s.id);
            if (def && def.image && !s.image) return { ...s, image: def.image };
            return s;
          });
          localStorage.setItem('jb_kitchen_subcategories', JSON.stringify(final));
          localStorage.setItem('jb_data_version', APP_DATA_VERSION);
          return final;
        }
        localStorage.setItem('jb_kitchen_subcategories', JSON.stringify(merged));
        localStorage.setItem('jb_data_version', APP_DATA_VERSION);
        return merged;
      }
    } catch (_) {}
    localStorage.setItem('jb_data_version', APP_DATA_VERSION);
    return DEFAULT_SUBCATEGORIES;
  });

  // Track locally deleted IDs so they don't get resurrected by periodic fetch
  const deletedProductIdsRef = useRef<Set<string>>(new Set());
  const deletedCategoryIdsRef = useRef<Set<string>>(new Set());
  const deletedSubcategoryIdsRef = useRef<Set<string>>(new Set());

  // ─── Periodic fetch of products from server (merge, don't overwrite) ───

  useEffect(() => {
    const fetchProducts = () => {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          if (!data.error && Array.isArray(data)) {
            setProducts(prev => {
              const prevMap = new Map<string, any>(prev.map((p: any) => [p.id, p]));
              const filteredServerData = data.filter(p => !deletedProductIdsRef.current.has(p.id) && !REMOVED_DEFAULT_PRODUCT_IDS.has(p.id));
              const alignedData = filteredServerData.map((p: any) => {
                const existing = prevMap.get(p.id);
                const def = defaultProductMap.get(p.id);
                let aligned = { ...p };
                if (def?.subcategoryId && p.subcategoryId !== def.subcategoryId) {
                  aligned.subcategoryId = def.subcategoryId;
                }
                if (existing?.image && existing.image.startsWith('/uploads/') && p.image !== existing.image) {
                  aligned.image = existing.image;
                } else if (!aligned.image && def?.image) {
                  aligned.image = def.image;
                }
                return aligned;
              });
              const merged = alignedData;
              localStorage.setItem('jb_kitchen_inventory', JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch(() => {});
    };
    fetchProducts();
    const interval = setInterval(fetchProducts, 10000);
    return () => clearInterval(interval);
  }, []);

  // ─── Periodic fetch of categories from server (merge, don't overwrite) ───

  useEffect(() => {
    const fetchCategories = () => {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
          if (!data.error && Array.isArray(data)) {
            setCategories(prev => {
              const prevMap = new Map<string, any>(prev.map((c: any) => [c.id, c]));
              const merged = data
                .filter((c: any) => !deletedCategoryIdsRef.current.has(c.id))
                .map((c: any) => {
                  const existing = prevMap.get(c.id);
                  if (!c.image) {
                    if (existing?.image) return { ...c, image: existing.image };
                    const def = DEFAULT_CATEGORIES.find((dc: any) => dc.id === c.id);
                    if (def?.image) return { ...c, image: def.image };
                  }
                  return c;
                });
              localStorage.setItem('jb_kitchen_categories', JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch(() => {});
    };
    fetchCategories();
    const interval = setInterval(fetchCategories, 10000);
    return () => clearInterval(interval);
  }, []);

  // ─── Periodic fetch of subcategories from server (merge, don't overwrite) ───

  useEffect(() => {
    const fetchSubcategories = () => {
      fetch('/api/subcategories')
        .then(res => res.json())
        .then(data => {
          if (!data.error && Array.isArray(data)) {
            setSubcategories(prev => {
              const prevMap = new Map<string, Subcategory>(prev.map(s => [s.id, s]));
              const rawData: any[] = data as any[];
              const filteredData: any[] = rawData.filter((d: any) =>
                !REMOVED_DEFAULT_SUBCATEGORY_IDS.has(d.id) &&
                !deletedSubcategoryIdsRef.current.has(d.id)
              );
              const cleanedData: any[] = filteredData.map((d: any) => {
                const existing = prevMap.get(d.id);
                if (d.image) return d;
                if (existing?.image) return { ...d, image: existing.image };
                const def = defaultSubcatMap.get(d.id);
                if (def?.image) return { ...d, image: def.image };
                return d;
              });
              const merged: any[] = cleanedData.map((s: any) => ({
                ...s, required: !!s.required, priceAdjustment: parseFloat(s.price) || 0, price: s.price !== null ? parseFloat(s.price) : null
              }));
              localStorage.setItem('jb_kitchen_subcategories', JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch(() => {});
    };
    fetchSubcategories();
    const interval = setInterval(fetchSubcategories, 10000);
    return () => clearInterval(interval);
  }, []);

  // ─── Order polling ───

  const isFirstOrderLoad = useRef(true);

  useEffect(() => {
    const fetchOrders = () => {
      fetch('/api/orders')
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setOrders(prevOrders => {
              if (isFirstOrderLoad.current) {
                isFirstOrderLoad.current = false;
                return data;
              }
              const currentIds = new Set(prevOrders.map(o => o.id));
              const hasNewOrder = data.some((o: any) => !currentIds.has(o.id));
              if (hasNewOrder) {
                const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
                audio.play().catch(() => {});
              }
              return data;
            });
            localStorage.setItem('jb_kitchen_orders', JSON.stringify(data));
          }
        })
        .catch(() => {
          setOrders(prev => {
            if (prev.length > 0) return prev;
            try {
              const saved = localStorage.getItem('jb_kitchen_orders');
              return saved ? JSON.parse(saved) : [];
            } catch (_) { return []; }
          });
        });
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // ─── Cart actions ───

  const addToCart = (product: Product, selectedSubcategoryIds?: string[]) => {
    if (product.isOutOfStock) return;
    const cartId = product.id + (selectedSubcategoryIds ? '-' + selectedSubcategoryIds.join('-') : '');
    setCart(prev => {
      const existing = prev.find(item => item.id === cartId);
      if (existing) {
        return prev.map(item =>
          item.id === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, id: cartId, quantity: 1, subcategoryIds: selectedSubcategoryIds }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateInstructions = (id: string, instructions: string) => {
    setCart(prev =>
      prev.map(item => (item.id === id ? { ...item, instructions } : item))
    );
  };

  const clearCart = () => setCart([]);

  // ─── Product CRUD ───

  const addProduct = async (product: Product) => {
    const updated = [...products, product];
    setProducts(updated);
    localStorage.setItem('jb_kitchen_inventory', JSON.stringify(updated));
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      if (data.products) {
        setProducts(prev => {
          const localIds = new Set(prev.map((p: any) => p.id));
          const serverOnly = data.products.filter((p: any) => !localIds.has(p.id));
          const merged = [...prev, ...serverOnly];
          localStorage.setItem('jb_kitchen_inventory', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (_) {}
  };

  const updateProduct = async (product: Product) => {
    const updated = products.map(p => (p.id === product.id ? product : p));
    setProducts(updated);
    localStorage.setItem('jb_kitchen_inventory', JSON.stringify(updated));
    try {
      const res = await fetch(`/api/products-update/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      if (data.products) {
        setProducts(prev => {
          const localIds = new Set(prev.map((p: any) => p.id));
          const serverOnly = data.products.filter((p: any) => !localIds.has(p.id));
          const merged = [...prev, ...serverOnly];
          localStorage.setItem('jb_kitchen_inventory', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (_) {}
  };

  const deleteProduct = (productId: string) => {
    deletedProductIdsRef.current.add(productId);
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    localStorage.setItem('jb_kitchen_inventory', JSON.stringify(updated));
    fetch(`/api/products-delete/${productId}`, {
      method: 'POST'
    }).catch(() => {});
  };

  // ─── Category CRUD ───

  const addCategory = async (category: Category) => {
    const updated = [...categories, category];
    setCategories(updated);
    localStorage.setItem('jb_kitchen_categories', JSON.stringify(updated));
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      const data = await res.json();
      if (data.categories) {
        setCategories(prev => {
          const serverMap = new Map<string, any>(data.categories.map((c: any) => [c.id, c]));
          const merged = prev.map(c => {
            const server = serverMap.get(c.id);
            if (server) {
              if (!server.image && c.image) return { ...server, image: c.image };
              return { ...c, ...server };
            }
            return c;
          });
          data.categories.forEach((c: any) => { if (!merged.find((m: any) => m.id === c.id)) merged.push(c); });
          localStorage.setItem('jb_kitchen_categories', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.error('Network error adding category:', err);
    }
  };

  const updateCategory = async (category: Category) => {
    const updated = categories.map(c => (c.id === category.id ? category : c));
    setCategories(updated);
    try { localStorage.setItem('jb_kitchen_categories', JSON.stringify(updated)); } catch (_) {}
    try {
      const res = await fetch(`/api/categories-update/${category.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Failed to update category on server:', data.error || 'Unknown error');
        return;
      }
      if (data.categories) {
        setCategories(prev => {
          const serverMap = new Map<string, any>(data.categories.map((c: any) => [c.id, c]));
          const merged = prev.map(c => {
            const server = serverMap.get(c.id);
            if (server) {
              if (!server.image && c.image) return { ...server, image: c.image };
              return { ...c, ...server };
            }
            return c;
          });
          data.categories.forEach((c: any) => { if (!merged.find((m: any) => m.id === c.id)) merged.push(c); });
          localStorage.setItem('jb_kitchen_categories', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.error('Network error updating category:', err);
    }
  };

  const deleteCategory = (categoryId: string) => {
    deletedCategoryIdsRef.current.add(categoryId);
    const updated = categories.filter(c => c.id !== categoryId);
    setCategories(updated);
    localStorage.setItem('jb_kitchen_categories', JSON.stringify(updated));
    const updatedProducts = products.map(p =>
      p.categoryId === categoryId ? { ...p, categoryId: undefined } : p
    );
    setProducts(updatedProducts);
    localStorage.setItem('jb_kitchen_inventory', JSON.stringify(updatedProducts));
    fetch(`/api/categories-delete/${categoryId}`, {
      method: 'POST'
    }).catch(() => {});
  };

  // ─── Subcategory CRUD ───

  const saveSubcategories = (updated: Subcategory[]) => {
    setSubcategories(updated);
    localStorage.setItem('jb_kitchen_subcategories', JSON.stringify(updated));
  };

  const addSubcategory = async (subcategory: Subcategory) => {
    const updated = [...subcategories, subcategory];
    saveSubcategories(updated);
    try {
      const res = await fetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subcategory)
      });
      const data = await res.json();
      if (data.subcategories) {
        setSubcategories(prev => {
          const localIds = new Set(prev.map((s: any) => s.id));
          const serverOnly = data.subcategories.filter((s: any) => !localIds.has(s.id));
          const merged = [...prev, ...serverOnly].map((s: any) => ({
            ...s, required: !!s.required, priceAdjustment: parseFloat(s.price) || 0, price: s.price !== null ? parseFloat(s.price) : null
          }));
          localStorage.setItem('jb_kitchen_subcategories', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (_) {}
  };

  const updateSubcategory = async (subcategory: Subcategory) => {
    const updated = subcategories.map(s => (s.id === subcategory.id ? subcategory : s));
    saveSubcategories(updated);
    try {
      await fetch(`/api/subcategories-update/${subcategory.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subcategory)
      });
    } catch (_) {}
  };

  const deleteSubcategory = async (subcategoryId: string) => {
    const updated = subcategories.filter(s => s.id !== subcategoryId);
    saveSubcategories(updated);
    deletedSubcategoryIdsRef.current.add(subcategoryId);
    setProducts(prev => {
      const updatedProds = prev.map(p =>
        p.subcategoryId === subcategoryId
          ? { ...p, subcategoryId: undefined, subcategoryIds: p.subcategoryIds?.filter(id => id !== subcategoryId) }
          : p
      );
      localStorage.setItem('jb_kitchen_inventory', JSON.stringify(updatedProds));
      return updatedProds;
    });
    try {
      await fetch(`/api/subcategories-delete/${subcategoryId}`, {
        method: 'POST'
      });
    } catch (_) {}
  };

  const getCategorySubcategories = (categoryId: string): Subcategory[] => {
    return subcategories.filter(s => s.categoryId === categoryId).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  };

  const getCategoryType = (categoryId: string): { hasSubcategories: boolean } => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return { hasSubcategories: false };
    return { hasSubcategories: !!cat.hasSubcategories };
  };

  // ─── Order actions ───

  const placeOrder = (orderData: { customerName: string; customerPhone: string; address: string; total: number; paymentMethod: 'COD' | 'Online'; taxAmount: number; taxRate: number }): string => {
    if (cart.length === 0) return '';

    const totalCost = cart.reduce((acc, item) => acc + ((item.costPrice || (item.price * 0.6)) * item.quantity), 0);
    const profit = orderData.total - totalCost - orderData.taxAmount;

    const newOrder: Order = {
      id: `JB-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      address: orderData.address,
      items: [...cart],
      total: orderData.total,
      totalCost,
      profit,
      status: 'Pending',
      paymentMethod: orderData.paymentMethod,
      taxAmount: orderData.taxAmount,
      taxRate: orderData.taxRate,
      createdAt: new Date().toISOString(),
    };

    setOrders(prev => {
      const updated = [newOrder, ...prev];
      localStorage.setItem('jb_kitchen_orders', JSON.stringify(updated));
      return updated;
    });

    setRecentOrders(prev => {
      const updated = [newOrder.id, ...prev].slice(0, 5);
      localStorage.setItem('jb_recent_orders', JSON.stringify(updated));
      return updated;
    });

    clearCart();

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.error('Failed to save order:', err));

    return newOrder.id;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map(order => (order.id === orderId ? { ...order, status } : order));
    setOrders(updated);
    localStorage.setItem('jb_kitchen_orders', JSON.stringify(updated));
    fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});
  };

  const resetApp = () => {
    setCart([]);
    setOrders([]);
    setProducts(DEFAULT_PRODUCTS);
    setCategories(DEFAULT_CATEGORIES);
    setSubcategories(DEFAULT_SUBCATEGORIES);
    localStorage.removeItem('jb_kitchen_orders');
    localStorage.removeItem('jb_kitchen_inventory');
    localStorage.removeItem('jb_kitchen_categories');
    localStorage.removeItem('jb_kitchen_subcategories');
    localStorage.removeItem('jb_kitchen_subcategory_options');
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        updateInstructions,
        removeFromCart,
        clearCart,
        orders,
        recentOrders,
        products,
        categories,
        placeOrder,
        updateOrderStatus,
        orderType,
        setOrderType,
        userLocation,
        setUserLocation,
        isLocationVerified,
        setIsLocationVerified,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        subcategories,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        getCategorySubcategories,
        getCategoryType,
        resetApp,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}


