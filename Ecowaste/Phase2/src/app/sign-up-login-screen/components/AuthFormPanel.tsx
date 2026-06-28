'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { initializeAdminAccount } from '@/lib/requestStore';
import type { AuthRole, AuthMode } from './AuthScreen';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
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
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({ defaultValues: { remember: false } });

  useEffect(() => {
    initializeAdminAccount();
  }, []);

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        })
      });

      if (!res.ok) {
        toast.error('Incorrect email or password.');
        setLoading(false);
        return;
      }

      const resData = await res.json();
      
      // Store token so AdminDataService can use it
      localStorage.setItem('wastepickup_auth', JSON.stringify({
        token: resData.token,
        user: resData.user
      }));

      toast.success('Admin access granted.');
      router.push('/admin-dashboard');
    } catch (e) {
      toast.error('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16 overflow-y-auto">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <AppLogo size={36} />
        <span className="font-bold text-lg text-primary tracking-tight">EcoSortAI</span>
      </div>

      <div className="w-full max-w-md mx-auto">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Admin Authentication
          </h2>
          <p className="text-muted-foreground text-sm">
            Administrator Secure Access Point
          </p>
        </div>

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
              placeholder="admin@ecosort.ai"
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
        </form>
      </div>
    </div>
  );
}
