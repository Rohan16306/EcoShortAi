'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, User, Truck, ArrowRight } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { setCollectorSession, registerAccount, findAccount, accountExists, initializeAdminAccount } from '@/lib/requestStore';
import type { AuthRole, AuthMode } from './AuthScreen';
import { useEffect } from 'react';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

interface SignupFormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  vehicleType?: string;
  serviceArea?: string;
  agreeTerms: boolean;
}

interface Props {
  role: AuthRole;
  setRole: (r: AuthRole) => void;
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
}

export default function AuthFormPanel({ role, setRole, mode, setMode }: Props) {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({ defaultValues: { remember: false } });
  const signupForm = useForm<SignupFormData>({ defaultValues: { agreeTerms: false } });

  useEffect(() => {
    initializeAdminAccount();
  }, []);

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    // Check if account exists
    const account = findAccount(data.email, role);
    if (!account) {
      toast.error(
        role === 'collector' ?'No collector account found. Please sign up first.' :'No account found with this email. Please sign up first.'
      );
      return;
    }

    // Validate password
    if (account.password !== data.password) {
      toast.error('Incorrect password. Please try again.');
      return;
    }

    if (role === 'collector') {
      const initials = account.fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
      const session = {
        id: account.id,
        name: account.fullName,
        phone: account.phone,
        rating: 4.8,
        totalPickups: 0,
        vehicleType: account.vehicleType ?? 'Auto Rickshaw',
        serviceArea: account.serviceArea ?? 'Local Area',
        initials,
      };
      setCollectorSession(session);
      if (typeof window !== 'undefined') {
        localStorage.setItem('wastepickup_auth', JSON.stringify({ ...session, email: data.email, role: 'collector' }));
      }
      toast.success(`Welcome back, ${account.fullName}! Redirecting to your dashboard.`);
      router.push('/collector-dashboard');
    } else if (role === 'admin') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wastepickup_auth', JSON.stringify({
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          role: 'admin',
        }));
      }
      toast.success('Welcome Administrator!');
      router.push('/admin-dashboard');
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wastepickup_auth', JSON.stringify({
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          phone: account.phone,
          role: 'user',
        }));
      }
      toast.success(`Welcome back, ${account.fullName}!`);
      router.push('/pickup-request-tracking');
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    if (role === 'admin') {
      toast.error('Admin accounts cannot be created manually.');
      return;
    }
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    if (!data.agreeTerms) {
      toast.error('Please agree to the terms and conditions.');
      return;
    }

    // Check if account already exists
    if (accountExists(data.email, role)) {
      toast.error('An account with this email already exists. Please log in.');
      setMode('login');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);

    const id = `${role}-${Date.now()}`;
    registerAccount({
      id,
      email: data.email,
      password: data.password,
      role,
      fullName: data.fullName,
      phone: data.phone,
      vehicleType: data.vehicleType,
      serviceArea: data.serviceArea,
      createdAt: new Date().toISOString(),
    });

    if (role === 'collector') {
      const initials = data.fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
      const session = {
        id,
        name: data.fullName,
        phone: data.phone,
        rating: 5.0,
        totalPickups: 0,
        vehicleType: data.vehicleType ?? 'Auto Rickshaw',
        serviceArea: data.serviceArea ?? 'Local Area',
        initials,
      };
      setCollectorSession(session);
      if (typeof window !== 'undefined') {
        localStorage.setItem('wastepickup_auth', JSON.stringify({ ...session, email: data.email, role: 'collector' }));
      }
    }

    toast.success('Account created successfully! Please log in to continue.');
    signupForm.reset();
    setMode('login');
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16 overflow-y-auto">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <AppLogo size={36} />
        <span className="font-bold text-lg text-primary tracking-tight">EcoSortAI</span>
      </div>

      <div className="w-full max-w-md mx-auto">
        {/* Role tabs */}
        <div className="flex rounded-xl bg-muted p-1 mb-8">
          {(['user', 'collector', 'admin'] as AuthRole[]).map((r) => (
            <button
              key={`role-tab-${r}`}
              onClick={() => {
                setRole(r);
                if (r === 'admin') setMode('login');
              }}
              suppressHydrationWarning
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                role === r
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === 'user' ? <User size={16} /> : r === 'collector' ? <Truck size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              {r === 'user' ? 'User' : r === 'collector' ? "Collector" : "Admin"}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {role === 'admin' ? (
              <span>Administrator Secure Access Point</span>
            ) : mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  suppressHydrationWarning
                  onClick={() => setMode('signup')}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  suppressHydrationWarning
                  onClick={() => setMode('login')}
                  className="text-primary font-semibold hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5 fade-in">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Email address
              </label>
              <input
                suppressHydrationWarning
                type="email"
                {...loginForm.register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              {loginForm.formState.errors.email && (
                <p className="text-destructive text-xs mt-1.5">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-foreground">Password</label>
              </div>
              <div className="relative">
                <input
                  suppressHydrationWarning
                  type={showPass ? 'text' : 'password'}
                  {...loginForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-destructive text-xs mt-1.5">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                suppressHydrationWarning
                type="checkbox"
                id="remember"
                {...loginForm.register('remember')}
                className="w-4 h-4 rounded border-input accent-primary"
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground">
                Remember me for 30 days
              </label>
            </div>

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Log in
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {role !== 'admin' && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                Don&apos;t have an account?{' '}
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up first
                </button>{' '}
                to access the platform.
              </p>
            )}
          </form>
        ) : (
          /* ── SIGNUP FORM ── */
          <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4 fade-in">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label>
              <input
                suppressHydrationWarning
                type="text"
                {...signupForm.register('fullName', { required: 'Full name is required' })}
                placeholder="Arjun Sharma"
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              {signupForm.formState.errors.fullName && (
                <p className="text-destructive text-xs mt-1.5">{signupForm.formState.errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Phone Number</label>
              <input
                suppressHydrationWarning
                type="tel"
                {...signupForm.register('phone', { required: 'Phone number is required' })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              {signupForm.formState.errors.phone && (
                <p className="text-destructive text-xs mt-1.5">{signupForm.formState.errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Email address</label>
              <input
                suppressHydrationWarning
                type="email"
                {...signupForm.register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              {signupForm.formState.errors.email && (
                <p className="text-destructive text-xs mt-1.5">{signupForm.formState.errors.email.message}</p>
              )}
            </div>

            {role === 'collector' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Vehicle Type</label>
                  <select
                    suppressHydrationWarning
                    {...signupForm.register('vehicleType')}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  >
                    <option value="Auto Rickshaw">Auto Rickshaw</option>
                    <option value="Mini Truck">Mini Truck</option>
                    <option value="Bicycle Cart">Bicycle Cart</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Service Area</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    {...signupForm.register('serviceArea')}
                    placeholder="e.g. Koramangala, Bangalore"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  suppressHydrationWarning
                  type={showPass ? 'text' : 'password'}
                  {...signupForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {signupForm.formState.errors.password && (
                <p className="text-destructive text-xs mt-1.5">{signupForm.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  suppressHydrationWarning
                  type={showConfirm ? 'text' : 'password'}
                  {...signupForm.register('confirmPassword', { required: 'Please confirm your password' })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {signupForm.formState.errors.confirmPassword && (
                <p className="text-destructive text-xs mt-1.5">{signupForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                suppressHydrationWarning
                type="checkbox"
                id="agreeTerms"
                {...signupForm.register('agreeTerms', { required: true })}
                className="w-4 h-4 mt-0.5 rounded border-input accent-primary flex-shrink-0"
              />
              <label htmlFor="agreeTerms" className="text-sm text-muted-foreground leading-snug">
                I agree to the{' '}
                <span className="text-primary font-semibold">Terms of Service</span> and{' '}
                <span className="text-primary font-semibold">Privacy Policy</span>
              </label>
            </div>

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}