# CareerPilot AI — AI Operating Manual

> **FOR AI ASSISTANTS ONLY.** This document is the complete operating context for any AI working on CareerPilot. Read this first. Do not read the entire codebase unless a specific file is referenced here. If something is not described in this document, check the actual source file before assuming it does not exist.

---

## 1. Project Overview

### Project Name
**CareerPilot AI**

### Purpose
An AI-powered career operating system for software engineers. Users upload their resume, define a target role and timeline, and receive a personalized roadmap, skill gap analysis, daily planner, and readiness score. The goal is to help engineers systematically close the gap between where they are and where they want to be.

### Current Stage
**Early Alpha — Core Infrastructure Complete, Feature Integration In Progress.**
Authentication, journeys, and the resume data layer are fully implemented. All other feature pages currently show mock/hardcoded data and are not connected to the backend.

### Tech Stack

| Layer | Technology |
| :--- | :--- |
| UI Framework | React 19 |
| Language | TypeScript 5 |
| Build Tool | Vite 7 |
| Routing | TanStack Router (file-based) |
| Server State | TanStack Query (React Query) |
| Backend | Supabase (Auth + Postgres + Storage) |
| Styling | Tailwind CSS 4 |
| Component Library | shadcn/ui (Radix UI primitives) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Notifications | Sonner (installed, not used in services or hooks) |

### Folder Structure

```
src/
├── components/
│   ├── app-shell.tsx       ← AppShell layout + PageHeader component
│   ├── layouts/            ← (legacy folder, AppShell.tsx, SideBar.tsx, TopNavBar.tsx)
│   └── ui/                 ← 46 shadcn/ui primitives (button, card, dialog, etc.)
├── features/
│   ├── auth/
│   │   ├── components/     ← AuthCard, LoginForm, SignupForm, ProtectedRoute, etc.
│   │   ├── hooks/          ← useAuth, useCurrentUser, useSession
│   │   ├── pages/          ← LoginPage, SignupPage
│   │   ├── providers/      ← AuthProvider
│   │   ├── services/       ← authService
│   │   ├── types/          ← AuthUser, AuthSession, AuthState, etc.
│   │   └── index.ts        ← Public barrel export
│   ├── journey/
│   │   ├── components/     ← OnboardingGate
│   │   ├── hooks/          ← useJourney
│   │   ├── pages/          ← JourneyWizardPage
│   │   ├── services/       ← journeyService
│   │   └── types/          ← Journey, CreateJourneyRequest, JourneyRole, ExperienceLevel
│   ├── resume/
│   │   ├── components/     ← EMPTY — no components yet
│   │   ├── hooks/          ← useResume
│   │   ├── pages/          ← EMPTY — no page component yet
│   │   ├── services/       ← resumeService, storageService
│   │   └── types/          ← ResumeVersion, CreateResumeRequest
│   ├── dashboard/          ← EMPTY directory
│   ├── insights/           ← EMPTY directory
│   ├── planner/            ← EMPTY directory
│   ├── profile/            ← EMPTY directory
│   └── roadmap/            ← EMPTY directory
├── lib/
│   ├── supabase.ts         ← Supabase client singleton
│   └── utils.ts            ← cn() utility (clsx + tailwind-merge)
├── routes/                 ← TanStack Router file-based routes
├── styles.css
└── types/                  ← App-wide shared types (if any)
```

### High-Level Architecture

```
User Action
    ↓
Route Component (in /routes)
    ↓
Page Component (in feature/pages OR inline in route file)
    ↓
Hook (in feature/hooks) — orchestrates everything
    ↓
Service (in feature/services) — talks to Supabase only
    ↓
Supabase Client (src/lib/supabase.ts)
    ↓
Supabase Database / Storage / Auth
```

### Coding Philosophy
- Feature-based architecture. No exceptions.
- Services hold zero React code. They are pure async functions returning `{ data, error }`.
- Hooks orchestrate services. They manage state, effects, and expose a typed public API.
- Components read from hooks. They never touch Supabase.
- All errors are normalized into `{ message: string; code?: string }`.
- Singletons are exported as lowercase constants: `export const resumeService = new ResumeService()`.
- Interface types are exported alongside implementations: `IResumeService`, `IStorageService`.
- TypeScript is strict. No `any`. Use `unknown` + type narrowing when needed.

---

## 2. Current Sprint

### Current Sprint
**Sprint 1 — Core Data Layer**

### Current Goal
Build a solid, production-grade data layer before touching any UI integration.

### Completed Tasks
- [x] Authentication service (`authService`)
- [x] `AuthProvider` context
- [x] `useAuth`, `useCurrentUser`, `useSession` hooks
- [x] Route guards: `beforeLoad`, `ProtectedRoute`, `OnboardingGate`
- [x] Journey CRUD service (`journeyService`)
- [x] `useJourney` hook with full CRUD
- [x] `JourneyWizardPage` — multi-step form with Zod + RHF
- [x] Resume metadata service (`resumeService`)
- [x] Resume file storage service (`storageService`) with PDF validation + sanitized filenames
- [x] `useResume` hook with upload rollback, optimistic local state update, and delete coordination
- [x] `docs/PROJECT_CONTEXT.md` — living developer documentation
- [x] `docs/AI_CONTEXT.md` — this document
- [x] Resume page UI connected to `useResume()` — upload wired, real data rendered, empty states added
- [x] Upload card disabled with visual feedback during upload (`isLoading`)
- [x] Upload description corrected to PDF-only
- [x] Upload error surfaced below drop zone
- [x] `formatDate()` helper for `uploaded_at` ISO timestamps
- [x] Unimplemented buttons (Download, Trash, Export all) marked `disabled` with `title="Coming soon"`

### Current Task
Connecting the Dashboard page (`/app/dashboard`) to `useJourney()` and `useResume()` for live data.

### Next Task
Implement delete resume flow — wire Trash buttons to `deleteResume(version.id, version.storage_path)` in `useResume()`.

### Blocked Tasks
- AI analysis pipeline: **Blocked** — no backend function/edge function written yet.
- Insights page data: **Blocked** — depends on AI analysis output.

### Future Sprints
- Sprint 2: Connect Resume page + Dashboard to live data
- Sprint 3: AI analysis pipeline (edge function / Supabase function)
- Sprint 4: Insights, Compare, Suggestions pages wired to real analysis data
- Sprint 5: Roadmap + Planner live data
- Sprint 6: Profile editing, notification preferences
- Sprint 7: Polish, error states, empty states, loading skeletons

---

## 3. Project Completion

| Area | Completion | Notes |
| :--- | :--- | :--- |
| **Overall** | **~28%** | Resume page fully wired; Dashboard next |
| Authentication | 100% | Full service + provider + guards + forms |
| Journey | 100% | Full CRUD service + hook + wizard page |
| Resume (backend) | 100% | Storage + DB service + hook complete |
| Resume (UI integration) | 90% | Upload ✅ · Live list ✅ · Delete ❌ · Download ❌ |
| Dashboard | 10% | UI shell exists; all data is hardcoded |
| AI Analysis Pipeline | 0% | Not implemented |
| Insights | 5% | UI-only mock |
| Compare | 5% | UI-only mock |
| Suggestions | 5% | UI-only mock |
| Analysis (loading page) | 5% | UI-only mock |
| Roadmap | 5% | UI-only mock |
| Planner | 5% | UI-only mock |
| Profile | 20% | UI exists; email/initials from `useAuth`, rest mocked |

---

## 4. Feature Inventory

### Auth Feature
| Item | Value |
| :--- | :--- |
| **Status** | ✅ Complete |
| **Purpose** | User signup, login, session management, route protection |
| **Folder** | `src/features/auth/` |
| **Pages** | LoginPage, SignupPage |
| **Components** | AuthCard, AuthFormField, AuthErrorAlert, AuthLoadingScreen, LoginForm, SignupForm, PasswordInput, ProtectedRoute |
| **Hooks** | `useAuth()`, `useCurrentUser()`, `useSession()` |
| **Services** | `authService` (signIn, signUp, signOut, getCurrentUser, getSession, subscribeToAuthChanges) |
| **Types** | AuthUser, AuthSession, AuthResult\<T\>, AuthServiceError, AuthState, LoginFormValues, SignupFormValues |
| **Context Provider** | `AuthProvider` — wraps entire app in `__root.tsx` |
| **DB Tables** | `auth.users` (Supabase managed) |
| **Storage Buckets** | None |
| **Integration** | ✅ Fully integrated |
| **Missing Pieces** | Password reset flow, OAuth providers |
| **Next Steps** | Password reset if needed |

---

### Journey Feature
| Item | Value |
| :--- | :--- |
| **Status** | ✅ Complete |
| **Purpose** | User defines career target: role, experience level, timeline, daily study hours |
| **Folder** | `src/features/journey/` |
| **Pages** | JourneyWizardPage (multi-step wizard) |
| **Components** | OnboardingGate (redirect guard) |
| **Hooks** | `useJourney()` — load, create, update, delete, refresh |
| **Services** | `journeyService` (createJourney, getJourneyByUserId, updateJourney, deleteJourney) |
| **Types** | Journey, CreateJourneyRequest, UpdateJourneyRequest, JourneyRole, ExperienceLevel |
| **Context Provider** | None |
| **DB Tables** | `journeys` |
| **Storage Buckets** | None |
| **Integration** | ✅ Fully integrated at `/app/journey/create` |
| **Missing Pieces** | Editing existing journey from Profile page, multiple journeys |
| **Next Steps** | Wire journey data into Dashboard header |

---

### Resume Feature
| Item | Value |
| :--- | :--- |
| **Status** | 🟡 UI Integrated — delete + download pending |
| **Purpose** | Upload PDF resumes, version-track them, display history |
| **Folder** | `src/features/resume/` |
| **Pages** | **EMPTY** — page is rendered directly from the route file |
| **Components** | **EMPTY** — no dedicated components; `Mini` stat card is inline in the route file |
| **Hooks** | `useResume()` — upload, delete, load latest, load all, refresh |
| **Services** | `resumeService` (uploadResume, getLatestResumeByUserId, getAllResumesByUserId, deleteResume), `storageService` (uploadResumeFile, deleteResumeFile, getSignedResumeUrl) |
| **Types** | ResumeVersion, CreateResumeRequest |
| **Context Provider** | None |
| **DB Tables** | `resume_versions` |
| **Storage Buckets** | `resume-files` |
| **Integration** | ✅ Upload wired · ✅ `resumes` list rendered · ✅ `latestResume` sidebar · ✅ Empty states · ❌ Delete not wired · ❌ Download not wired |
| **Missing Pieces** | Wire Trash buttons to `deleteResume(version.id, version.storage_path)`, implement signed URL download via `getSignedResumeUrl()` |
| **Next Steps** | 1. Wire delete flow · 2. Wire download via signed URL · 3. Connect resume data to Dashboard |

---

### Dashboard Feature
| Item | Value |
| :--- | :--- |
| **Status** | 🔴 Mock Data Only |
| **Purpose** | Overview of career readiness: score, skill gaps, roadmap progress, daily tasks |
| **Folder** | `src/features/dashboard/` — **EMPTY** |
| **Pages** | Inline in `src/routes/app.dashboard.tsx` |
| **Components** | StatCard, QuickAction, PriorityChip, Legend, TrendChart — all inline, all hardcoded |
| **Hooks** | None connected |
| **Services** | None |
| **DB Tables** | None used yet |
| **Integration** | ❌ All data hardcoded in JSX |
| **Next Steps** | Integrate `useJourney()` for role/timeline display, `useResume()` for version display |

---

### Insights Feature
| Item | Value |
| :--- | :--- |
| **Status** | 🔴 Mock Data Only |
| **Folder** | `src/features/insights/` — **EMPTY** |
| **Pages** | Inline in `src/routes/app.insights.tsx` |
| **Integration** | ❌ All data hardcoded |
| **Next Steps** | Requires AI analysis pipeline first |

---

### Planner Feature
| Item | Value |
| :--- | :--- |
| **Status** | 🔴 Mock Data Only |
| **Folder** | `src/features/planner/` — **EMPTY** |
| **Pages** | Inline in `src/routes/app.planner.tsx` |
| **Integration** | ❌ Calendar and Kanban use hardcoded March 2026 data |

---

### Roadmap Feature
| Item | Value |
| :--- | :--- |
| **Status** | 🔴 Mock Data Only |
| **Folder** | `src/features/roadmap/` — **EMPTY** |
| **Pages** | Inline in `src/routes/app.roadmap.tsx` |
| **Integration** | ❌ Sprint/module data hardcoded in JSX |

---

### Profile Feature
| Item | Value |
| :--- | :--- |
| **Status** | 🟡 Partially Integrated |
| **Folder** | `src/features/profile/` — **EMPTY** |
| **Pages** | Inline in `src/routes/app.profile.tsx` |
| **Integration** | Email/initials derive from `useAuth()` in AppShell — profile page itself uses hardcoded "Arjun Kumar" strings |

---

## 5. Page Inventory

### `/` — Landing Page
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ✅ (static) |
| API | ❌ |
| Mock Data | NO — static marketing content |
| Components Used | MarketingNav, Hero, Features, HowItWorks, ResumeAnalysisPreview, etc. (all inline) |
| Missing | CTA links to `/auth/login` not `/app/dashboard` when unauthenticated |

---

### `/auth/login` — Login Page
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ✅ |
| API | ✅ |
| Mock Data | NO |
| Components Used | LoginPage → LoginForm → AuthCard, AuthFormField, PasswordInput, AuthErrorAlert |
| Missing | Nothing critical |

---

### `/auth/signup` — Signup Page
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ✅ |
| API | ✅ |
| Mock Data | NO |
| Components Used | SignupPage → SignupForm → AuthCard, AuthFormField, PasswordInput, AuthErrorAlert |
| Missing | Email confirmation handling UX |

---

### `/app/dashboard` — Dashboard
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ❌ |
| API | ❌ |
| Mock Data | YES — all stat values, chart data, task list hardcoded in JSX |
| Components Used | PageHeader, StatCard, TrendChart, QuickAction, PriorityChip, Legend (all inline) |
| Missing | `useJourney()` for role display, `useResume()` for resume version display, readiness score from AI analysis |

---

### `/app/journey` — Journey (quick tab view)
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ❌ (local `useState` only, no persistence) |
| API | ❌ |
| Mock Data | YES — role/experience/timeline choices are local state |
| Components Used | PageHeader, WizardStep, SelectableCard, ChipCard (all inline) |
| Missing | This route is a non-functional preview; the real wizard is at `/app/journey/create` |

---

### `/app/journey/create` — Journey Wizard
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ✅ |
| API | ✅ |
| Mock Data | NO |
| Components Used | JourneyWizardPage (from `src/features/journey/pages/`) with Card, Button from shadcn/ui, useJourney() |
| Missing | Nothing critical — fully integrated |

---

### `/app/resume` — Resume Page
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ✅ Upload + live data rendering |
| API | ✅ Upload → Supabase Storage + DB |
| Mock Data | NO — all mock data removed |
| Components Used | PageHeader, Mini (inline); `useResume()`, `useJourney()` |
| Wired | Upload (PDF only, disabled while loading) · `latestResume` sidebar · `resumes` version table · `formatDate()` for dates · Empty states |
| NOT Wired | Delete (Trash buttons disabled, `title="Coming soon"`) · Download (disabled) · Export all (disabled) · Readiness score (TODO — needs AI analysis) · Notes column (TODO — needs DB field) |

---

### `/app/analysis` — Analysis Loading Page
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ❌ |
| API | ❌ |
| Mock Data | YES — pipeline stages, timer hardcoded |
| Missing | Real analysis polling, progress tracking |

---

### `/app/suggestions` — Resume Suggestions
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ❌ |
| API | ❌ |
| Mock Data | YES — suggestion groups hardcoded |
| Missing | AI analysis pipeline |

---

### `/app/compare` — Resume Comparison
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ❌ |
| API | ❌ |
| Mock Data | YES — v3/v4 diff, DiffCard data hardcoded |
| Missing | `useResume()` for version picker, AI diff engine |

---

### `/app/insights` — Insights
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ❌ |
| API | ❌ |
| Mock Data | YES — scores, skills, gaps hardcoded |
| Missing | AI analysis output table |

---

### `/app/planner` — Planner
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ❌ |
| API | ❌ |
| Mock Data | YES — March 2026 calendar events, Kanban tasks hardcoded |
| Missing | Tasks DB table + hook |

---

### `/app/roadmap` — Roadmap
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | ❌ |
| API | ❌ |
| Mock Data | YES — sprint/module/task data hardcoded |
| Missing | Roadmap DB table + hook |

---

### `/app/profile` — Profile
| Item | Status |
| :--- | :--- |
| UI | ✅ |
| Logic | 🟡 Partial |
| API | 🟡 Partial |
| Mock Data | YES — name, email, GitHub, stats hardcoded as "Arjun Kumar" etc. |
| Components Used | PageHeader, Field, Toggle (all inline) |
| Missing | Wire form fields to `useAuth()` user object, connect journey section to `useJourney()` |

---

## 6. Component Inventory

### `AppShell` — `src/components/app-shell.tsx`
| Item | Value |
| :--- | :--- |
| Purpose | Root authenticated layout — sidebar, topbar, main content area |
| Props | None (used as TanStack Router route component) |
| Used In | `/app` layout route — wraps all `/app/*` pages |
| Reusable? | No — structural singleton |
| Reuse in future? | No |

---

### `PageHeader` — `src/components/app-shell.tsx`
| Item | Value |
| :--- | :--- |
| Purpose | Consistent page-top heading with eyebrow text, title, description, and action buttons |
| Props | `{ eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }` |
| Used In | Every single `/app/*` page |
| Reusable? | YES |
| Reuse in future? | YES — every new page MUST use this |

---

### `ProtectedRoute` — `src/features/auth/components/ProtectedRoute.tsx`
| Item | Value |
| :--- | :--- |
| Purpose | Client-side auth guard; redirects to `/auth/login` when unauthenticated |
| Props | `{ children: ReactNode; redirectTo?: string }` |
| Used In | Inside `AppShell` wrapping `OnboardingGate` |
| Reusable? | YES |
| Reuse in future? | YES — for any new authenticated section |

---

### `OnboardingGate` — `src/features/journey/components/OnboardingGate.tsx`
| Item | Value |
| :--- | :--- |
| Purpose | Second guard — if user has no journey, redirects to `/app/journey/create`; exempts the wizard itself |
| Props | `{ children: ReactNode }` |
| Used In | Inside `AppShell`, wrapping `<Outlet />` |
| Reusable? | YES |
| Reuse in future? | YES — do not bypass or duplicate |

---

### `AuthCard` — `src/features/auth/components/AuthCard.tsx`
| Item | Value |
| :--- | :--- |
| Purpose | Styled card shell for auth forms |
| Reusable? | YES (for auth forms only) |
| Reuse in future? | YES for any new auth-related form |

---

### `AuthLoadingScreen` — `src/features/auth/components/AuthLoadingScreen.tsx`
| Item | Value |
| :--- | :--- |
| Purpose | Full-screen loading spinner shown while session resolves |
| Reusable? | YES |
| Reuse in future? | YES for any full-viewport loading state |

---

### `AuthErrorAlert` — `src/features/auth/components/AuthErrorAlert.tsx`
| Item | Value |
| :--- | :--- |
| Purpose | Displays an error message string inside an alert box |
| Reusable? | YES |
| Reuse in future? | YES for form error display |

---

### `JourneyWizardPage` — `src/features/journey/pages/JourneyWizardPage.tsx`
| Item | Value |
| :--- | :--- |
| Purpose | Full multi-step wizard for creating a journey (role, experience, timeline, hours) |
| Used In | `/app/journey/create` route |
| Reusable? | No — single-purpose page |

---

## 7. Existing Resources

> **AI Rule: Before building anything, check this list. If it exists, reuse it.**

### Reusable Components
- `PageHeader` — use on every new page
- `ProtectedRoute` — use for any new auth-guarded section
- `OnboardingGate` — already in AppShell, do not add again
- `AuthLoadingScreen` — use for full-page loading states
- `AuthErrorAlert` — use for error display in forms
- `AuthCard` — use for auth-adjacent card containers

### Reusable Hooks
- `useAuth()` — user, session, isLoading, isAuthenticated, signIn, signUp, signOut
- `useCurrentUser()` — returns `AuthUser | null`
- `useSession()` — returns `AuthSession | null`
- `useJourney()` — journey, isLoading, error, createJourney, updateJourney, deleteJourney, refreshJourney
- `useResume()` — latestResume, resumes, isLoading, error, uploadResume, deleteResume, refreshResumes

### Reusable Services
- `authService` — `signIn`, `signUp`, `signOut`, `getCurrentUser`, `getSession`, `subscribeToAuthChanges`
- `journeyService` — `createJourney`, `getJourneyByUserId`, `updateJourney`, `deleteJourney`
- `resumeService` — `uploadResume`, `getLatestResumeByUserId`, `getAllResumesByUserId`, `deleteResume`
- `storageService` — `uploadResumeFile`, `deleteResumeFile`, `getSignedResumeUrl`

### Reusable Layouts
- `AppShell` — the authenticated layout (sidebar + topbar + main)
- Auth layout — `src/routes/auth.tsx` (renders `<Outlet />`)

### Reusable shadcn/ui Components (in `src/components/ui/`)
Button, Card, CardHeader, CardContent, CardTitle, CardDescription, Dialog, Input, Label, Form, Select, Badge, Tabs, Tooltip, Separator, Progress, Skeleton, ScrollArea, Avatar, Accordion, Checkbox, Switch, RadioGroup, Textarea, Table, Alert, AlertDialog, DropdownMenu, Popover, Sheet, Drawer, HoverCard, Collapsible, Command, Menubar, NavigationMenu, Pagination, Resizable, Slider, Toggle, ToggleGroup, Calendar, Carousel, Chart (Recharts wrapper), AspectRatio, Breadcrumb, ContextMenu, InputOtp, Sonner (toast)

### Reusable Charts
- `src/components/ui/chart.tsx` — Recharts wrapper from shadcn. Use this for all charts.

### Reusable Upload Components
- None exist yet. The `<input type="file" />` on `/app/resume` is a raw non-functional element. Build a `ResumeUpload` component in `src/features/resume/components/` when integrating.

### Reusable Forms
- `LoginForm`, `SignupForm` — auth forms only.
- No shared generic form components beyond shadcn `Form` primitives.

---

## 8. Current UI Description

### Sidebar (AppShell)
Fixed left sidebar (hidden on mobile). Contains:
- CareerPilot AI brand logo
- Navigation links: Dashboard, Journey, Resume, Insights, Roadmap, Planner, Profile
- "Recent" section with 3 hardcoded journey names
- "Free plan" usage card with upgrade button
- Settings link (non-functional) + Sign out button (functional)

### Topbar (AppShell)
Sticky. Contains:
- Mobile hamburger button (non-functional)
- Breadcrumb showing current section name
- Search input (non-functional)
- Resume version picker (non-functional — shows "Resume v4" text)
- Dark mode toggle button (non-functional)
- Notifications bell (non-functional)
- User avatar/initials (derived from `useAuth().user.email`)

### Dashboard (`/app/dashboard`)
- 4 stat cards: Readiness 78/100, Skills 42/56, Roadmap 63%, Active Gaps 11 — **all mock**
- Readiness trend SVG chart — **mock data**
- "Today" task list — **mock data**
- Roadmap progress bars — **mock data**
- Top skill gaps list — **mock data**
- Quick actions (links to Resume, Insights, Roadmap, Compare)

### Resume Page (`/app/resume`)
- Upload zone (drag-and-drop UI, file input non-functional)
- Current resume card showing v4 stats — **mock**
- Version history table (4 rows) — **mock**

### Journey Page (`/app/journey`)
- 5-step wizard UI (local state only, no persistence)
- NOT the real wizard — the real one is at `/app/journey/create`

### Journey Create (`/app/journey/create`)
- Real multi-step wizard using `JourneyWizardPage`
- Fully connected to `useJourney()` → `journeyService` → Supabase

---

## 9. Data Flow

### Authentication Flow

```
User submits login form
    ↓
LoginForm (calls useAuth().signIn)
    ↓
AuthProvider.signIn()
    ↓
authService.signIn(email, password)
    ↓
supabase.auth.signInWithPassword()
    ↓
onAuthStateChange fires → applySession()
    ↓
AuthContext updated → isAuthenticated: true
    ↓
TanStack Router beforeLoad guard passes
    ↓
User lands on /app/dashboard
```

---

### Journey Flow

```
User submits JourneyWizardPage (Step 5 — Review)
    ↓
useJourney().createJourney(request)
    ↓
journeyService.createJourney(userId, request)
    ↓
supabase.from('journeys').insert({...}).select().single()
    ↓
Returns Journey row → stored in useJourney state
    ↓
OnboardingGate detects journey !== null → allows /app/* access
```

---

### Resume Upload Flow

```
User selects PDF file
    ↓
useResume().uploadResume(file, journeyId)
    ↓
  ┌─ Validation: file.type === 'application/pdf' AND file.size > 0
  │   └── If invalid → return { error: "Only PDF files..." }
  ↓
storageService.uploadResumeFile(file, userId, journeyId)
    ↓
  Path: {userId}/{journeyId}/{timestamp}_{sanitizedFilename}.pdf
    ↓
supabase.storage.from('resume-files').upload(path, file)
    ↓
  If fails → return storage error (NO DB write)
    ↓
resumeService.uploadResume(userId, { journey_id, file_name, storage_path, file_size })
    ↓
supabase.from('resume_versions').insert({...}).select().single()
    ↓
  If fails → storageService.deleteResumeFile(storagePath)  ← ROLLBACK
             then return DB error
    ↓
  If success → setLatestResume(newVersion)
               setResumes(prev => [newVersion, ...prev])
```

---

### Resume Delete Flow

```
User clicks delete on a version
    ↓
useResume().deleteResume(resumeId, storagePath)
    ↓
storageService.deleteResumeFile(storagePath)
    ↓
  If fails → return storage error (NO DB delete)
    ↓
resumeService.deleteResume(resumeId)
    ↓
  TODO: If DB delete fails after storage delete → orphaned metadata row remains
         (needs future background cleanup job)
    ↓
  If success → setResumes(prev => prev.filter(r => r.id !== resumeId))
               setLatestResume(prev => prev?.id === resumeId ? null : prev)
```

---

## 10. Database

### `journeys` Table
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key → `auth.users.id` |
| `target_role` | text | One of: Software Engineer, Frontend Engineer, React Developer, Full Stack Engineer, Backend Engineer |
| `experience_level` | text | One of: Student, Fresher, Junior, Mid-Level |
| `timeline_months` | integer | Positive integer |
| `daily_study_hours` | integer | Positive integer |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

**Used by**: `journeyService` · **Hook**: `useJourney` · **Pages**: `/app/journey/create`

---

### `resume_versions` Table
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key → `auth.users.id` |
| `journey_id` | uuid | Foreign key → `journeys.id` |
| `file_name` | text | Original filename |
| `storage_path` | text | Full path in `resume-files` bucket |
| `file_size` | integer | File size in bytes |
| `version_number` | integer | Auto-incremented per user per journey |
| `uploaded_at` | timestamptz | Auto |

**Used by**: `resumeService` · **Hook**: `useResume` · **Pages**: `/app/resume` (currently mock)

---

### `auth.users` (Supabase Managed)
Standard Supabase auth table. Accessed only through `supabase.auth.*` methods inside `authService`. Never queried directly via `supabase.from('auth.users')`.

---

## 11. Storage

### Bucket: `resume-files`
| Item | Value |
| :--- | :--- |
| **Purpose** | Store uploaded PDF resume files |
| **Visibility** | Private (signed URLs required) |
| **Folder Convention** | `{userId}/{journeyId}/{timestamp}_{sanitizedFilename}.pdf` |
| **Upload Flow** | `storageService.uploadResumeFile(file, userId, journeyId)` → `supabase.storage.from('resume-files').upload(path, file, { contentType: 'application/pdf', upsert: false })` |
| **Delete Flow** | `storageService.deleteResumeFile(storagePath)` → `supabase.storage.from('resume-files').remove([path])` |
| **Signed URLs** | `storageService.getSignedResumeUrl(storagePath)` → valid for 3600 seconds (1 hour) |
| **Validation** | Only `application/pdf` files allowed; empty files (size=0) rejected before upload |
| **Filename Sanitization** | trim() → spaces to underscores → remove non-`[a-zA-Z0-9_\-.]` characters |

---

## 12. Routing

### Public Routes
```
/                    ← Landing page (no auth required)
/auth                ← Auth layout (redirects to /app/dashboard if already logged in)
/auth/login          ← Login form
/auth/signup         ← Signup form
```

### Protected Routes (require auth)
```
/app                 ← Protected layout (beforeLoad redirects to /auth/login if no session)
/app/                ← Redirects to /app/dashboard
/app/dashboard       ← Main workspace
/app/journey         ← Journey quick-view (mock)
/app/journey/create  ← Real journey wizard (real data)
/app/resume          ← Resume management (mock)
/app/analysis        ← AI analysis loading (mock)
/app/suggestions     ← Resume suggestions (mock)
/app/compare         ← Resume comparison (mock)
/app/insights        ← Skill insights (mock)
/app/planner         ← Daily planner (mock)
/app/roadmap         ← Learning roadmap (mock)
/app/profile         ← User profile (partially integrated)
```

### Route Guards Execution Order
```
beforeLoad (/app) → checks authService.getCurrentUser()
    ↓
ProtectedRoute (client-side) → checks useAuth().isAuthenticated
    ↓
OnboardingGate → checks useJourney().journey !== null
    ↓
Route renders
```

### Redirect Logic
| Scenario | Redirect |
| :--- | :--- |
| Not logged in, visits `/app/*` | → `/auth/login?redirect={currentPath}` |
| Logged in, visits `/auth/*` | → `/app/dashboard` |
| Logged in, no journey, visits `/app/*` (except `/app/journey/create`) | → `/app/journey/create` |
| Visits `/app/` (index) | → `/app/dashboard` |
| Visits `/auth/` (index) | → `/auth/login` |

---

## 13. Authentication

### Login Flow
1. User submits `LoginForm` (email + password, Zod-validated)
2. `useAuth().signIn()` calls `authService.signIn()`
3. `authService` calls `supabase.auth.signInWithPassword()`
4. On success: Supabase fires `onAuthStateChange` → `AuthProvider.applySession()` sets state
5. `isAuthenticated` becomes true → component re-renders → redirect to saved `redirect` param or `/app/dashboard`

### Signup Flow
1. User submits `SignupForm` (email + password + confirmPassword, Zod-validated)
2. `useAuth().signUp()` calls `authService.signUp()`
3. `authService` calls `supabase.auth.signUp()`
4. On success: State cleared, user prompted (email confirmation may be required per Supabase config)

### Session Hydration
- On app mount, `AuthProvider` calls `authService.getSession()` synchronously (reads localStorage)
- This prevents the flash-of-unauthenticated-content for returning users
- Then subscribes to `onAuthStateChange` for all future events (token refresh, expiry, etc.)

### Token Persistence
- Supabase automatically persists the JWT in `localStorage`
- `authService.getSession()` reads from there — no network call
- `authService.getCurrentUser()` calls `supabase.auth.getUser()` — validates JWT with Supabase servers

---

## 14. Architecture

### Service Layer Rules
```typescript
// ✅ Correct — service returns typed result, no React
async uploadResume(userId: string, request: CreateResumeRequest): Promise<ResumeResult<ResumeVersion>> {
    const { data, error } = await supabase.from('resume_versions').insert(...).select().single();
    if (error) return { data: null, error: normalizeResumeError(error) };
    return { data: data as ResumeVersion, error: null };
}

// ❌ Wrong — services never use useState, useEffect, navigate, toast
```

### Hook Layer Rules
```typescript
// ✅ Correct — hook orchestrates service, manages state, exposes typed API
const uploadResume = useCallback(async (file: File, journeyId: string) => {
    if (!user) return { message: 'You must be signed in.' };
    const { data: path, error: storageErr } = await storageService.uploadResumeFile(...);
    if (storageErr) { setError(storageErr); return storageErr; }
    const { data, error: dbErr } = await resumeService.uploadResume(...);
    if (dbErr) { await storageService.deleteResumeFile(path!); setError(dbErr); return dbErr; }
    setResumes(prev => [data!, ...prev]);
    return null;
}, [user]);

// ❌ Wrong — hooks never call supabase directly, never navigate, never show toasts
```

### Error Handling Pattern
Every service method uses a try/catch and a `normalize*Error` function:
```typescript
function normalizeResumeError(err: unknown): ResumeServiceError {
    if (err !== null && typeof err === 'object') {
        const candidate = err as Record<string, unknown>;
        const message = typeof candidate['message'] === 'string' ? candidate['message'] : 'An unexpected error occurred.';
        const code = typeof candidate['code'] === 'string' ? candidate['code'] : undefined;
        return { message, code };
    }
    if (err instanceof Error) return { message: err.message };
    return { message: 'An unexpected error occurred.' };
}
```

### Naming Conventions
| Type | Convention | Example |
| :--- | :--- | :--- |
| Services | camelCase singleton | `resumeService`, `authService` |
| Interfaces | `I` prefix | `IResumeService`, `IStorageService` |
| Hooks | `use` prefix | `useResume`, `useJourney` |
| Return types | `Use*Return` | `UseResumeReturn`, `UseJourneyReturn` |
| Error types | `*ServiceError` | `ResumeServiceError`, `StorageServiceError` |
| Result types | `*Result<T>` | `ResumeResult<T>`, `StorageResult<T>` |
| Components | PascalCase | `AuthCard`, `OnboardingGate` |
| Route files | kebab with dots | `app.resume.tsx`, `auth.login.tsx` |

### Import Convention
- Use `@/` alias for src root: `import { supabase } from '@/lib/supabase'`
- Feature imports are relative: `import { resumeService } from '../services/resume.service'`
- shadcn/ui components: `import { Button } from '@/components/ui/button'`
- Auth public API: `import { authService, useAuth } from '@/features/auth'`

---

## 15. Coding Standards

> These are non-negotiable conventions observed across the entire codebase.

- [ ] Services **never import React**, `useState`, `useEffect`, `useNavigate`, or `toast`
- [ ] Hooks **orchestrate services** — they never call `supabase` directly
- [ ] Components **never call `supabase`** directly
- [ ] Components **never call services** directly — always go through a hook
- [ ] Every service method returns `{ data: T | null, error: ServiceError | null }`
- [ ] Every error is run through a `normalize*Error()` function before being returned
- [ ] Services are exported as singletons: `export const resumeService: IResumeService = new ResumeService()`
- [ ] Hooks use `useCallback` for all action methods
- [ ] Hooks use `mountedRef` to guard against state updates on unmounted components in **action callbacks**
- [ ] Hooks use a **per-effect `cancelled` flag** for effect-based data loading when needed
- [ ] TypeScript: **no `any`** — use `unknown` with type guards
- [ ] Filenames: services use `feature.service.ts`, hooks use `useFeature.ts`, types use `feature.types.ts`
- [ ] Every new feature goes in `src/features/featureName/`
- [ ] `src/components/ui/` is for shadcn/ui only — never put feature components there
- [ ] `PageHeader` is used on every `/app` page — never invent a new page header

---

## 16. AI Rules

> **Read every rule before writing a single line of code.**

### Before Creating a Component
1. Check Section 6 (Component Inventory) — does it already exist?
2. Check `src/components/ui/` — is there a shadcn primitive for this?
3. Check `src/features/*/components/` — does a feature component exist?
4. **Only if nothing exists** — create a new component in the appropriate feature folder.

### Before Creating a Hook
1. Check Section 7 (Existing Resources → Reusable Hooks)
2. Check `src/features/*/hooks/` for each feature
3. **Do not create a second hook for something `useResume`, `useJourney`, or `useAuth` already handles**

### Before Creating a Service
1. Check Section 7 (Existing Resources → Reusable Services)
2. Services exist for: auth, journey, resume (DB), resume (storage)
3. **Do not call `supabase` outside of a service**

### General Rules
- **Do NOT call `supabase` inside a component or hook directly** — create/extend a service
- **Do NOT duplicate UI** — if a page's UI already exists, extend it; don't rebuild it
- **Do NOT create parallel architecture** — no new state management patterns without a strong reason
- **Do NOT add business logic to route files** — routes should only define the route and render a component
- **Do NOT add toasts/notifications to services or hooks** — return errors, let the component decide
- **ALWAYS use `PageHeader`** when creating a new `/app` page
- **ALWAYS follow the `{ data, error }` return pattern** in new service methods
- **ALWAYS normalize errors** through a `normalize*Error()` function
- **ALWAYS put new features in `src/features/featureName/`** with `components/`, `hooks/`, `services/`, `types/` subfolders
- **Update `docs/AI_CONTEXT.md`** after every completed sprint or major feature addition

---

## 17. Technical Debt

### Known Issues
1. **Non-transactional delete in `useResume.deleteResume()`**: Storage is deleted first; if DB delete then fails, the metadata row in `resume_versions` becomes orphaned with no corresponding file. Needs background cleanup or server-side transaction.

2. **`OnboardingGate` has a `console.log`**: The gate currently logs `[OnboardingGate]` state on every render — this should be removed before production.

3. **`/app/journey` route is a duplicate/preview**: The route `app.journey.tsx` contains a non-functional local-state only wizard that duplicates the real wizard at `app.journey_.create.tsx`. The intent of this route is unclear.

### Mock Data Locations
| File | Mock Data |
| :--- | :--- |
| `src/routes/app.dashboard.tsx` | All stat values, chart series, task list, skill gaps |
| ~~`src/routes/app.resume.tsx`~~ | ~~`const versions = [...]`~~ — **Removed. Now uses live `useResume()` data.** |
| `src/routes/app.insights.tsx` | All scores, skill breakdowns, gap list |
| `src/routes/app.compare.tsx` | Version pair, diff data |
| `src/routes/app.suggestions.tsx` | All suggestion groups |
| `src/routes/app.analysis.tsx` | Pipeline stages, timer |
| `src/routes/app.planner.tsx` | Calendar events, Kanban tasks |
| `src/routes/app.roadmap.tsx` | Sprint/module/task data |
| `src/routes/app.profile.tsx` | User name, email, GitHub, stats |

### TODOs Found in Code
- `storageService.ts`: No TODOs
- `useResume.ts`: TODO comment in `deleteResume` about non-atomic delete
- `OnboardingGate.tsx`: Debug `console.log` present
- `app.resume.tsx`: TODO — readiness score placeholder (needs AI analysis) · TODO — notes column (needs `notes` field in `resume_versions`)

### Limitations
- No password reset flow implemented
- No OAuth (Google, GitHub) implemented
- Resume upload validates PDF type but MIME type can be spoofed — server-side validation recommended
- Signed URL expiry is 1 hour (hardcoded) — no refresh mechanism

---

## 18. Roadmap

### Immediate Next Tasks (Sprint 2 — in progress)
1. ~~**Connect Resume Page UI** to `useResume()` hook~~ ✅ **DONE**
   - ~~Wire `<input type="file">` to `uploadResume(file, journeyId)`~~ ✅
   - ~~Render `resumes` array in the version history table~~ ✅
   - ~~Display `latestResume` in the "Current resume" sidebar panel~~ ✅
   - Wire Trash buttons to `deleteResume(resumeId, storagePath)` ← **NEXT**
   - Wire Download buttons via `storageService.getSignedResumeUrl(storagePath)`

2. **Connect Dashboard Page** to live data
   - Replace hardcoded role name with `useJourney().journey.target_role`
   - Replace hardcoded resume version with `useResume().latestResume`
   - Add empty states when journey or resume is null

### Sprint 3 — AI Analysis Pipeline
3. Create a Supabase Edge Function or backend endpoint to analyze resume text
4. Create an `analyses` or `analysis_results` database table to store AI output
5. Create `analysisService` + `useAnalysis` hook
6. Wire `/app/analysis` to show real pipeline progress

### Sprint 4 — Analysis-Derived Pages
7. Connect `/app/insights` to real analysis data
8. Connect `/app/suggestions` to real AI recommendations
9. Connect `/app/compare` to real diff logic

### Sprint 5 — Roadmap & Planner
10. Design `roadmap_sprints`, `roadmap_modules`, `tasks` DB tables
11. Create roadmap service + hook
12. Wire `/app/roadmap` to real sprint data
13. Wire `/app/planner` to real task data

### Sprint 6 — Profile & Settings
14. Wire `/app/profile` form fields to Supabase user metadata updates
15. Wire journey section to `useJourney()`
16. Implement password change flow

### Sprint 7 — Polish
17. Add loading skeleton states to all pages
18. Add error boundary and fallback UI
19. Remove `console.log` from `OnboardingGate`
20. Remove mock data from all remaining route files

---

## 19. Current State Summary (AI Briefing)

> **This is the essential context for any AI starting work on this project.**

```
CURRENT STATE:
=============
✅ Authentication: 100% complete
   - authService, AuthProvider, useAuth, ProtectedRoute, LoginForm, SignupForm all work

✅ Journey: 100% complete
   - journeyService, useJourney, JourneyWizardPage, OnboardingGate all work

✅ Resume Data Layer: 100% complete
   - storageService: validates PDF, sanitizes filename, uploads, deletes, generates signed URLs
   - resumeService: inserts/reads/deletes resume_versions rows
   - useResume: upload (with DB rollback on failure), delete, load latest, load all

✅ Resume Page UI: INTEGRATED (upload + live data)
   - File: src/routes/app.resume.tsx
   - useResume() and useJourney() are imported and initialized
   - Upload: <input accept="application/pdf"> → handleFileChange → uploadResume(file, journey.id)
   - Upload card disabled (pointer-events-none, opacity-60) while isLoading
   - Upload error rendered below drop zone from useResume().error
   - Current resume aside: shows latestResume.file_name, version_number, formatted uploaded_at
   - Empty state rendered when latestResume is null
   - Version table: resumes.map() using real DB fields (id, file_name, version_number, uploaded_at)
   - Latest version highlighted by comparing v.id === latestResume?.id
   - Empty state rendered when resumes.length === 0
   - formatDate() helper converts ISO timestamps to "Jun 30, 2026" format
   - Readiness score: shows "—" placeholder (TODO: needs AI analysis)
   - Notes column: shows "—" (TODO: needs notes field in resume_versions table)
   - Delete/Download/Export buttons: disabled + title="Coming soon"

❌ Dashboard: NOT integrated
   - Full UI exists at /app/dashboard
   - All stats, chart data, task list hardcoded

❌ All other pages: Mock Data Only
   - /app/insights, /app/suggestions, /app/compare, /app/analysis, /app/planner, /app/roadmap, /app/profile

NEXT RECOMMENDED TASK:
=====================
1. Wire delete resume flow in src/routes/app.resume.tsx:
   - Change Trash buttons from disabled to active
   - onClick: () => deleteResume(v.id, v.storage_path)
   - deleteResume() already exists in useResume() — no service changes needed
   - Destructure deleteResume from useResume() (it is already exported by the hook)

2. Wire download:
   - onClick: async () => { const { data } = await storageService.getSignedResumeUrl(v.storage_path); window.open(data, '_blank'); }
   - storageService must be imported directly for this one-off use

DO NOT:
=======
- Call supabase directly from the route component
- Create a new hook — useResume() already has deleteResume()
- Create a new service — storageService.getSignedResumeUrl() already exists
- Rebuild any UI — only wire the existing disabled buttons
```
