import React, { useState } from 'react';
import axios from 'axios';

interface AuthPageProps {
  onSuccess: (user: any) => void;
  onBackToHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBackToHome }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await axios.post('/api/auth/register', {
          full_name: fullName,
          emailOrPhone: identifier,
          password: password,
        });
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          onSuccess(res.data.user);
        }
      } else {
        const res = await axios.post('/api/auth/login', {
          identifier: identifier,
          password: password,
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onSuccess(res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-900 font-sans">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        
        <div>
          <button 
            onClick={onBackToHome}
            className="text-xs font-semibold tracking-wider text-indigo-300 hover:text-white transition uppercase flex items-center gap-2"
          >
            ← Back to Store
          </button>
        </div>

        <div className="relative z-10 max-w-md">
          <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            SmartMarket Ethiopia
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mt-4 mb-3">
            {isSignUp ? 'Join our growing community today.' : 'Welcome back to your marketplace.'}
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Discover top-tier electronics, daily essentials, and seamless shopping experience designed for Ethiopia.
          </p>
        </div>

        <div className="text-xs text-indigo-400">
          &copy; 2026 SmartMarket Inc. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex items-center justify-center p-8 bg-gray-50 lg:rounded-l-3xl shadow-2xl">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {isSignUp ? 'Create an Account' : 'Sign In'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {isSignUp ? 'Enter your details to get started.' : 'Please enter your login details.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Meseret Fentahun"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none transition" 
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Email or Ethiopian Phone</label>
              <input 
                type="text" 
                required 
                placeholder="name@example.com or 0911223344"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none transition" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Password</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none transition" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm mt-4 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }} 
              className="text-indigo-600 font-bold hover:underline ml-1"
            >
              {isSignUp ? 'Sign In' : 'Create one'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};