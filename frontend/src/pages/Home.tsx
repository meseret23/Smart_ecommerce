
import React, { useState } from 'react';
import { User, ShoppingBag, Search, X } from 'lucide-react';
import axios from 'axios';

export const HomePage: React.FC = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    emailOrPhone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        await axios.post('http://localhost:5000/api/auth/register', {
          full_name: formData.full_name,
          email: formData.emailOrPhone.includes('@') ? formData.emailOrPhone : '',
          phone: !formData.emailOrPhone.includes('@') ? formData.emailOrPhone : '',
          password: formData.password
        });
        setIsSignUp(false);
        setError('Account created! Please sign in.');
      } else {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
          emailOrPhone: formData.emailOrPhone,
          password: formData.password
        });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        setIsAuthOpen(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white text-xs py-1.5 text-center font-medium">
        FREE EXPRESS SHIPPING ON ALL ORDERS OVER $50.00
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-blue-700">MODERN</span>
            <span className="text-xl font-bold tracking-tight text-gray-900">RETAIL</span>
          </div>

          <div className="flex-1 max-w-md relative">
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full bg-gray-100 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <Search className="w-4 h-4 absolute right-3.5 top-2.5 text-gray-400" />
          </div>

          <div className="flex items-center gap-4 text-gray-700">
            {user ? (
              <span className="text-sm font-semibold text-blue-600">Hi, {user.full_name}</span>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <User className="w-5 h-5" />
              </button>
            )}
            <button className="p-2 hover:bg-gray-100 rounded-full transition relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-6 flex justify-center space-x-8 text-xs font-semibold tracking-wider text-gray-600 py-3 uppercase">
            <a href="#" className="text-blue-600 border-b-2 border-blue-600 pb-1">Home</a>
            <a href="#" className="hover:text-blue-600 transition">Collections</a>
            <a href="#" className="hover:text-blue-600 transition">Products</a>
            <a href="#" className="hover:text-blue-600 transition">Electronics</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white h-[380px] flex items-center">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80" 
            alt="Hero Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="relative z-10 p-12 max-w-xl">
            <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              Winter 2026
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4">
              Elevate Your Daily Lifestyle
            </h1>
            <p className="text-gray-300 text-sm mb-6">
              Discover the perfect blend of high-performance tech and minimalist design.
            </p>
            <button className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition shadow-lg text-sm">
              Shop Collection →
            </button>
          </div>
        </div>
      </section>

      {/* Auth Modal overlay */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAuthOpen(false)} 
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {isSignUp ? 'Create an Account' : 'Sign In to SmartMarket'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email or Phone</label>
                <input 
                  type="text" 
                  required 
                  value={formData.emailOrPhone}
                  onChange={(e) => setFormData({...formData, emailOrPhone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-md text-sm mt-2"
              >
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }} 
                className="text-blue-600 font-semibold hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};