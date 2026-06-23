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

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useAuth, useCurrentUser, useSession } from './hooks/use-auth';
export type { UseAuthReturn } from './hooks/use-auth';

// ─── Components ───────────────────────────────────────────────────────────────
export { AuthCard } from './components/AuthCard';
export { AuthFormField } from './components/AuthFormField';
export { AuthErrorAlert } from './components/AuthErrorAlert';
export { PasswordInput } from './components/PasswordInput';
export { AuthLoadingScreen } from './components/AuthLoadingScreen';

// ─── Pages ────────────────────────────────────────────────────────────────────
export { LoginPage } from './pages/LoginPage';
export { SignupPage } from './pages/SignupPage';
