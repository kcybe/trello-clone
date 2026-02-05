import { type inferAsyncReturnType } from '@trpc/server';
import { type Session, type User } from 'better-auth';

export type { Session, User };

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  confirmPassword?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export type AuthResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: AuthError };
