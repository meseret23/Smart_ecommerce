import React, { useState } from 'react';
import axios from 'axios';

interface AuthPageProps {
  onSuccess: (user: any) => void;
  onBackToHome: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ 
  onSuccess, 
  onBackToHome, 
  initialMode = 'signin' 
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = [
  password.length >= 8,
  /[A-Z]/.test(password),
  /[0-9]/.test(password),
  /[^A-Za-z0-9]/.test(password),
].filter(Boolean).length;
const [showForgotPassword, setShowForgotPassword] = useState(false);
const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
const [recoveryLoading, setRecoveryLoading] = useState(false);
const [recoveryMessage, setRecoveryMessage] = useState("");
const [recoveryError, setRecoveryError] = useState("");

  const handleModeSwitch = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
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
      setError(
        err.response?.data?.message || 'Authentication failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  setRecoveryError("");
  setRecoveryMessage("");
  setRecoveryLoading(true);

  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/forgot-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: recoveryIdentifier,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    setRecoveryMessage(data.message);

  } catch (error) {
    setRecoveryError(
      error instanceof Error
        ? error.message
        : "Unable to send reset email."
    );
  } finally {
    setRecoveryLoading(false);
  }
};

 
  if (authMode === 'signin') {
    

return (
  <>
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">

      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl shadow-indigo-100/60 overflow-hidden grid lg:grid-cols-2 min-h-[650px]">

      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#102b20] via-[#174b35] to-[#0b1f17] p-12 text-white">

          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-violet-300/20 blur-2xl" />

          <div className="relative z-10">
            <button
              type="button"
              onClick={onBackToHome}
              className="text-2xl font-black tracking-tight"
            >
              SmartMarket<span className="text-violet-300">.</span>
            </button>

            <div className="mt-24">
              <span className="inline-block px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wider">
                YOUR SMART SHOPPING DESTINATION
              </span>

              <h1 className="text-5xl font-black leading-tight mt-7">
                Welcome back
                <br />
                to smarter
                <br />
                shopping.
              </h1>

              <p className="text-indigo-100 mt-6 text-base leading-7 max-w-md">
                Discover products you love, connect with trusted sellers,
                and enjoy a seamless shopping experience.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-sm text-indigo-100">
            <span>SmartMarket © 2026</span>
            <span>Shop smarter. Live better.</span>
          </div>
        </div>


        {/* RIGHT SIGN IN PANEL */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">

          <div className="max-w-md w-full mx-auto">

            {/* MOBILE BRAND */}
            <div className="lg:hidden mb-10">
              <button
                type="button"
                onClick={onBackToHome}
              className="text-2xl font-black text-[#16845b]"
              >
                SmartMarket<span className="text-[#106746]">.</span>
              </button>
            </div>

            {/* HEADER */}
            <div className="mb-9">

              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="text-indigo-600"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                </svg>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Sign in
              </h2>

              <p className="text-slate-500 mt-3 text-sm">
                Welcome back! Enter your details to access your account.
              </p>

            </div>


            {/* SIGN IN FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email or phone number
                </label>

                <div className="relative">

                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </div>

                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Enter your email or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50/70 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300"
                  />

                </div>
              </div>


              {/* PASSWORD */}
              <div>

                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                </div>

                <div className="relative">

                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="10" width="18" height="11" rx="2" />
                      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                    </svg>
                  </div>

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50/70 rounded-xl pl-11 pr-14 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#16845b] transition-colors"

                  >
                    {showPassword ? (

                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 9 5 9 7a11.7 11.7 0 0 1-3 4.2M6.2 6.2C3.8 7.8 3 10.1 3 12c0 2 4 7 9 7a9 9 0 0 0 3-.5" />
                      </svg>

                    ) : (

                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>

                    )}
                  </button>

                </div>

                {/* FORGOT PASSWORD BUTTON */}
                <div className="flex justify-end mt-3">

                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryIdentifier(identifier);
                      setRecoveryMessage("");
                      setRecoveryError("");
                      setShowForgotPassword(true);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-violet-700 hover:underline transition"
                  >
                    Forgot password?
                  </button>

                </div>

              </div>


              {/* SIGN IN ERROR */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}


              {/* SIGN IN BUTTON */}
              <button
                type="submit"
                disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#16845b] hover:bg-[#106746] text-white font-bold text-sm shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

            </form>


            {/* SIGNUP LINK */}
            <div className="mt-8 text-center text-sm text-slate-500">

              Don't have an account?

              <button
                type="button"
               onClick={() => handleModeSwitch('signup')}
                className="relative w-full overflow-hidden flex items-center justify-center gap-2 bg-[#16845b] hover:bg-[#106746] text-white font-bold py-4 rounded-xl text-sm shadow-lg shadow-green-900/20 hover:shadow-green-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2"
              >
                Create account
              </button>

            </div>

          </div>
        </div>

      </div>
    </div>


    {showForgotPassword && (

      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">

        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 sm:p-9 animate-in fade-in zoom-in duration-200">

        
          <button
            type="button"
            onClick={() => setShowForgotPassword(false)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>


          {/* MODAL ICON */}
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">

            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>

          </div>


          <h2 className="text-2xl font-black text-slate-900">
            Forgot your password?
          </h2>

          <p className="text-sm text-slate-500 mt-3 leading-6">
            Don't worry! Enter the email address associated with your account
            and we'll send you a link to reset your password.
          </p>


          {/* RECOVERY FORM */}
          <form onSubmit={handleRecoverySubmit} className="space-y-5 mt-7">

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email address
              </label>

              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={recoveryIdentifier}
                onChange={(e) => setRecoveryIdentifier(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />

            </div>


            {/* RECOVERY ERROR */}
            {recoveryError && (

              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {recoveryError}
              </div>

            )}


            {/* RECOVERY SUCCESS */}
            {recoveryMessage && (

              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
                {recoveryMessage}
              </div>

            )}


            <button
              type="submit"
              disabled={recoveryLoading}
           className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#16845b] to-[#106746] text-white font-bold text-sm shadow-lg shadow-green-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {recoveryLoading ? "Sending reset link..." : "Send Reset Link"}
            </button>

          </form>


          {/* BACK TO SIGN IN */}
          <button
            type="button"
            onClick={() => setShowForgotPassword(false)}
            className="w-full mt-5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition"
          >
            ← Back to Sign In
          </button>

        </div>

      </div>

    )}

  </>
);


  }

  
  
return (
  <div className="min-h-screen flex bg-slate-950 font-sans overflow-hidden">

    {/* LEFT BRANDING PANEL */}
    {/* LEFT BRANDING PANEL */}
<div className="hidden lg:flex lg:w-[48%] xl:w-1/2 relative flex-col justify-between p-12 xl:p-16 text-white overflow-hidden">

  {/* Background */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#102b20] via-[#174b35] to-[#0b1f17]" />

  <div className="absolute -top-32 -right-20 w-96 h-96 bg-[#16845b]/20 rounded-full blur-[100px] animate-pulse" />
  <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-[#106746]/20 rounded-full blur-[100px]" />

  {/* Decorative circles */}
  <div className="absolute top-[25%] right-[8%] w-64 h-64 border border-white/[0.07] rounded-full" />
  <div className="absolute top-[28%] right-[11%] w-52 h-52 border border-white/[0.07] rounded-full" />
  <div className="absolute top-[32%] right-[15%] w-36 h-36 bg-[#16845b]/10 rounded-full blur-xl" />

  {/* Top */}
  <div className="relative z-10">

    <button
      onClick={onBackToHome}
      className="flex items-center gap-3 text-green-200/80 hover:text-white text-xs font-semibold tracking-wide transition-all duration-300 group"
    >
      <span className="w-9 h-9 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center group-hover:bg-white/15 transition-all">
        ←
      </span>
      BACK TO STORE
    </button>

    <div className="mt-14 flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#48b987] to-[#106746] flex items-center justify-center shadow-lg shadow-green-900/30">
        <span className="text-white text-xl font-black">S</span>
      </div>

      <div>
        <h2 className="font-black text-lg tracking-tight">
          SmartMarket
        </h2>
        <p className="text-[10px] text-green-300 tracking-[0.2em] uppercase">
          Shopping made smarter
        </p>
      </div>
    </div>

  </div>

  {/* Main branding content */}
  <div className="relative z-10 max-w-lg -mt-8">

    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-green-300/20 bg-green-400/10 text-green-200 text-[10px] font-bold tracking-[0.15em] uppercase">
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
      Smart Shopping. Better Living.
    </div>

    <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.12] mt-7">
      Your next
      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-200 via-emerald-300 to-teal-200">
        great find
      </span>
      starts here.
    </h1>

    <p className="mt-6 text-sm text-green-100/70 leading-7 max-w-md">
      Discover products, enjoy intelligent recommendations,
      and experience a smarter way to shop.
      Everything you need, all in one marketplace.
    </p>

    {/* Feature cards */}
    <div className="grid grid-cols-2 gap-3 mt-10">

      <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md hover:bg-white/10 transition-all duration-300">
        <div className="text-xl mb-3">✦</div>
        <h3 className="font-bold text-xs">AI Recommendations</h3>
        <p className="text-[10px] text-green-200/60 mt-1">
          Find what you actually need.
        </p>
      </div>

      <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md hover:bg-white/10 transition-all duration-300">
        <div className="text-xl mb-3">🛍️</div>
        <h3 className="font-bold text-xs">Easy Shopping</h3>
        <p className="text-[10px] text-green-200/60 mt-1">
          A seamless shopping experience.
        </p>
      </div>

    </div>

    {/* Floating decorative card */}
    <div className="absolute -right-3 xl:-right-8 top-[-70px] translate-x-1/2 hidden xl:flex">
      <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-3xl shadow-xl animate-bounce [animation-duration:4s]">
        🛒
      </div>
    </div>

  </div>

  {/* Footer */}
  <div className="relative z-10 flex justify-between items-center text-[10px] text-green-300/50">
    <span>© 2026 SmartMarket. All rights reserved.</span>
    <span>Made for smarter shopping in Ethiopia.</span>
  </div>

</div>


    {/* RIGHT SIGNUP SECTION */}
    <div className="flex-1 relative min-h-screen flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 bg-[#f5f6fc] lg:rounded-l-[2.5rem] overflow-y-auto">

      {/* Mobile background decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-200/40 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-200/30 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[440px] py-4">

        {/* Mobile brand */}
        <div className="lg:hidden flex justify-between items-center mb-10">

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
              S
            </div>

            <span className="font-black text-lg text-slate-900">
              SmartMarket
            </span>
          </div>

          <button
            onClick={onBackToHome}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            ← Store
          </button>

        </div>


        {/* FORM CARD */}
        <div className="bg-white/90 backdrop-blur-xl p-7 sm:p-10 rounded-[28px] border border-white shadow-[0_20px_70px_rgba(30,41,90,0.10)]">

          {/* Heading */}
          <div className="mb-8">

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl mb-5">
              👋
            </div>

            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-indigo-600 mb-2">
              Join SmartMarket
            </p>

            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Create account
            </h2>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Create your account and start discovering a smarter way to shop.
            </p>

          </div>


          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-start gap-2 animate-pulse">
              <span className="text-base">⚠</span>
              <span>{error}</span>
            </div>
          )}


          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            <div className="group">

              <label className="block text-xs font-bold text-slate-700 mb-2">
                Full Name
              </label>

              <div className="relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                  </svg>
                </span>

                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/70 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300"
                />

              </div>
            </div>


            {/* Email or Phone */}
            <div className="group">

              <label className="block text-xs font-bold text-slate-700 mb-2">
                Email or Ethiopian Phone
              </label>

              <div className="relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>

                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="name@example.com or 0911223344"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/70 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300"
                />

              </div>
            </div>


            {/* Password */}
            <div className="group">

              <div className="flex justify-between items-center mb-2">

                <label className="text-xs font-bold text-slate-700">
                  Password
                </label>

                <span className="text-[10px] text-slate-400">
                  Minimum 8 characters
                </span>

              </div>

              <div className="relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/70 rounded-xl pl-11 pr-14 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 9 5 9 7a11.7 11.7 0 0 1-3 4.2M6.2 6.2C3.8 7.8 3 10.1 3 12c0 2 4 7 9 7a9 9 0 0 0 3-.5" />
                    </svg>
                  ) : (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>

              </div>

              {/* Password strength */}
              {password.length > 0 && (

                <div className="mt-3">

                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength > level
                            ? passwordStrength <= 1
                              ? "bg-rose-400"
                              : passwordStrength <= 2
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                            : "bg-slate-100"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2">
                    Password strength:{" "}
                    <span className={`font-bold ${
                      passwordStrength <= 1
                        ? "text-rose-500"
                        : passwordStrength <= 2
                        ? "text-amber-500"
                        : "text-emerald-600"
                    }`}>
                      {passwordStrength <= 1
                        ? "Weak"
                        : passwordStrength <= 2
                        ? "Moderate"
                        : passwordStrength === 3
                        ? "Good"
                        : "Strong"}
                    </span>
                  </p>

                </div>

              )}

            </div>


            {/* Submit */}
           <button
  type="submit"
  disabled={loading}
  className="group relative w-full overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-[#16845b] via-[#147750] to-[#106746] hover:from-[#106746] hover:to-[#0b5136] text-white font-bold py-4 rounded-xl text-sm shadow-lg shadow-green-900/20 hover:shadow-green-900/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2"
>
  {loading ? (
    <>
      <svg className="animate-spin w-5 h-5 text-green-100" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25" />
        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      Creating your account...
    </>
  ) : (
    <>
      Create Account
      <span className="text-lg text-green-100 transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </>
  )}
</button>

          </form>


          {/* Sign in */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">

            <p className="text-xs text-slate-500">
              Already have an account?

              <button
                type="button"
                onClick={() => handleModeSwitch('signin')}
              className="relative w-full overflow-hidden flex items-center justify-center gap-2 bg-[#16845b] hover:bg-[#106746] text-white font-bold py-4 rounded-xl text-sm shadow-lg shadow-green-900/20 hover:shadow-green-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2"
              >
                Sign in
              </button>
            </p>

          </div>

        </div>


        {/* Bottom trust message */}
        <div className="flex justify-center items-center gap-2 mt-6 text-[10px] text-slate-400">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Your account information is handled securely.
        </div>

      </div>

    </div>

  </div>
);

};