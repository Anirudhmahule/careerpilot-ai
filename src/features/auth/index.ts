// ─── Types ────────────────────────────────────────────────────────────────────
export type {
    AuthUser,
    AuthSession,
    AuthResult,
    AuthServiceError,
    AuthState,
    LoginFormValues,
    SignupFormValues,
} from './types';

// ─── Service ──────────────────────────────────────────────────────────────────
export { authService } from './services/auth.service';
export type { IAuthService } from './services/auth.service';

// ─── Provider ─────────────────────────────────────────────────────────────────
export { AuthProvider, useAuthContext } from './providers/AuthProvider';
export type { AuthContextValue } from './providers/AuthProvider';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useAuth, useCurrentUser, useSession } from './hooks/use-auth';
export type { UseAuthReturn } from './hooks/use-auth';

// ─── Components ───────────────────────────────────────────────────────────────
export { AuthCard } from './components/AuthCard';
export { AuthFormField } from './components/AuthFormField';
export { AuthErrorAlert } from './components/AuthErrorAlert';
export { PasswordInput } from './components/PasswordInput';
export { AuthLoadingScreen } from './components/AuthLoadingScreen';
export { ProtectedRoute } from './components/ProtectedRoute';
export { LoginForm } from './components/LoginForm';
export { SignupForm } from './components/SignupForm';

// ─── Pages ────────────────────────────────────────────────────────────────────
export { LoginPage } from './pages/LoginPage';
export { SignupPage } from './pages/SignupPage';
