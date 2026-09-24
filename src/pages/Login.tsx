import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ChefHat } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid username or password');
        return;
      }
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('user_role', data.user.role);
      sessionStorage.setItem('user_id', String(data.user.id));
      sessionStorage.setItem('user_name', data.user.name);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'cook') {
        navigate('/kitchen');
      } else {
        setError('Access denied. Admin or cook credentials required.');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/JBMM.png" alt="Logo" className="h-16 w-auto" />
            <span className="text-3xl font-black text-primary italic font-headline tracking-tighter">JBMM</span>
          </Link>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter italic">Admin Portal<span className="text-primary">.</span></h1>
          <p className="text-on-surface-variant text-sm mt-2 font-bold uppercase tracking-widest opacity-50">Identity Verification Required</p>
          <div className="mt-4 inline-block bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
            <p className="text-primary text-[11px] font-bold uppercase tracking-widest">Customers: Please return to the menu to order.</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="bg-surface-container-low rounded-2xl p-8 border border-white/5 shadow-2xl">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Staff Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-on-surface-variant/30" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-surface-container-highest border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/20"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Staff Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-on-surface-variant/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-highest border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/20"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-primary text-sm font-bold text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full mt-8 bg-primary text-on-primary py-4 rounded-xl font-bold font-headline hover:bg-primary/90 transition-all active:scale-95"
            >
              Log In to Dashboard
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-on-surface-variant/60 hover:text-primary font-bold text-sm transition-colors"
          >
            &larr; Back to Restaurant Menu
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-on-surface-variant/40">
          JB Mega Mart Kitchen &copy; 2026. Authorized access only.
        </p>
      </div>
    </div>
  );
}
