'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { SignInInput, SignUpInput } from '@/features/auth/types';

import { useState } from 'react';

interface AuthFormProps {
  onSuccess?: () => void;
  defaultView?: 'sign-in' | 'sign-up';
}

export function AuthForm({ onSuccess, defaultView = 'sign-in' }: AuthFormProps) {
  const [view, setView] = useState<'sign-in' | 'sign-up'>(defaultView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  const [signInData, setSignInData] = useState<SignInInput>({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState<SignUpInput>({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn(signInData);

    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error?.message || 'Sign in failed');
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    const result = await signUp(signUpData);

    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error?.message || 'Sign up failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">
          {view === 'sign-in' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-muted-foreground">
          {view === 'sign-in'
            ? 'Enter your credentials to sign in'
            : 'Enter your details to create an account'}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            view === 'sign-in'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setView('sign-in')}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            view === 'sign-up'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setView('sign-up')}
        >
          Sign Up
        </button>
      </div>

      {view === 'sign-in' ? (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              value={signInData.email}
              onChange={e => setSignInData({ ...signInData, email: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              placeholder="••••••••"
              value={signInData.password}
              onChange={e => setSignInData({ ...signInData, password: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Name</Label>
            <Input
              id="signup-name"
              type="text"
              placeholder="John Doe"
              value={signUpData.name}
              onChange={e => setSignUpData({ ...signUpData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={signUpData.email}
              onChange={e => setSignUpData({ ...signUpData, email: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              value={signUpData.password}
              onChange={e => setSignUpData({ ...signUpData, password: e.target.value })}
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm-password">Confirm Password</Label>
            <Input
              id="signup-confirm-password"
              type="password"
              placeholder="••••••••"
              value={signUpData.confirmPassword}
              onChange={e => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      )}
    </div>
  );
}
