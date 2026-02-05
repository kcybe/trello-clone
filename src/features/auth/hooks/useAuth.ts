'use client';

import type { Session, User } from 'better-auth';

import type { AuthState, SignInInput, SignUpInput } from '@/features/auth/types';
import { authClient } from '@/lib/auth-client';

import { useCallback, useEffect, useState } from 'react';

interface UseAuthReturn extends AuthState {
  signIn: (input: SignInInput) => Promise<{ success: boolean; error?: Error }>;
  signUp: (input: SignUpInput) => Promise<{ success: boolean; error?: Error }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const { data, error } = await authClient.getSession();
      if (error || !data) {
        setUser(null);
        setSession(null);
      } else {
        setUser(data.user);
        setSession(data.session);
      }
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const signIn = useCallback(async (input: SignInInput) => {
    try {
      setIsLoading(true);
      const { data, error } = await authClient.signIn.email({
        email: input.email,
        password: input.password,
      });
      if (error) {
        return { success: false, error: new Error(error.message) };
      }
      if (data) {
        setUser(data.user);
        setSession(data.session);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    try {
      setIsLoading(true);
      const { data, error } = await authClient.signUp.email({
        email: input.email,
        password: input.password,
        name: input.name,
      });
      if (error) {
        return { success: false, error: new Error(error.message) };
      }
      if (data) {
        setUser(data.user);
        setSession(data.session);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refresh,
  };
}
