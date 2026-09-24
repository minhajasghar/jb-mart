import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Kitchen from './pages/Kitchen';
import OrderConfirmation from './pages/OrderConfirmation';
import TrackOrder from './pages/TrackOrder';
import OrderSearch from './pages/OrderSearch';
import { AppProvider } from './context/AppContext';
import CartModal from './components/CartModal';

// Simple Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const isAuthenticated = sessionStorage.getItem('admin_authenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/track-order/:orderId" element={<TrackOrder />} />
          <Route path="/track" element={<OrderSearch />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kitchen" 
            element={
              <ProtectedRoute>
                <Kitchen />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <CartModal />
      </Router>
    </AppProvider>
  );
}
